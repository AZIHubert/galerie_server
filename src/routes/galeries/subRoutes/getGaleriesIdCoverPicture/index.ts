// GET /galeries/:galerieId/coverPicture/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  User,
} from '#src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '#src/helpers/errorMessages';
import {
  fetchCoverPicture,
} from '#src/helpers/fetch';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  let coverPicture;
  let galerie: Galerie | null;

  if (!uuidValidateV4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          model: User,
          where: {
            id: currentUser.id,
          },
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  try {
    coverPicture = await fetchCoverPicture(galerie, {
      id: galerie.users[0].id,
      role: galerie.users[0].GalerieUser.role,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      coverPicture,
      galerieId,
    },
  });
};
