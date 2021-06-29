// PUT /galeries/:galerieId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import generateGalerieHiddenName from '@src/helpers/generateGalerieHiddenName';
import {
  validatePutGaleriesIdBody,
  normalizeJoiErrors,
} from '@src/helpers/schemas';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let hiddenName;

  // Check request.body is not an empty object.
  if (req.body.description === undefined && req.body.name === undefined) {
    return res.status(400).send({
      errors: 'no change submited',
    });
  }

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: currentUser.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Archived galerie can't by updated.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot update an archived galerie',
    });
  }

  // Only creator or admin are allow to update galerie.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to update this galerie',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePutGaleriesIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Check if requested changes are not the same
  // has actual galerie's fields.
  if (
    value.description === galerie.description
    && value.name === galerie.name
  ) {
    return res.status(400).send({
      errors: 'no change submited',
    });
  }

  if (value.name) {
    try {
      hiddenName = await generateGalerieHiddenName(value.name);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  try {
    await galerie.update({
      ...value,
      hiddenName,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      description: galerie.description,
      galerieId: galerie.id,
      name: galerie.name,
    },
  });
};
