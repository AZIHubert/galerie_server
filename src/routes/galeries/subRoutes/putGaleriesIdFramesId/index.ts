import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  User,
} from '@src/db/models';

import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePutGaleriesIdFramesIdBody,
} from '@src/helpers/schemas';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  let frame: Frame | null;
  let galerie: Galerie | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
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
      errors: 'galerie not found',
    });
  }

  // Fetch Frame.
  try {
    frame = await Frame.findOne({
      where: {
        galerieId,
        id: frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }

  if (frame.userId !== currentUser.id) {
    return res.status(400).send({
      errors: 'you can\'t modify this frame',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePutGaleriesIdFramesIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Check if requested changes are not the same
  // has actual galerie's fields.
  if (value.description === frame.description) {
    return res.status(400).send({
      errors: 'no change submited',
    });
  }

  try {
    await frame.update(value);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Validate req.body
  // Check if value.description !== frame.description
  // update frame.
  // return value.description.

  return res.status(200).send({
    action: 'PUT',
    data: {
      description: frame.description,
      frameId,
      galerieId,
    },
  });
};
