// GET /galeries/:galerieId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import { fetchCoverPicture } from '@src/helpers/fetch';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  let currentCoverPicture;
  let galerie: Galerie | null;

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
      attributes: {
        exclude: [
          'updatedAt',
        ],
      },
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

  try {
    currentCoverPicture = await fetchCoverPicture(galerie);
  } catch (err) {
    return res.status(500).send(err);
  }

  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);

  // Set GalerieUser.hasNewFrame to false.
  if (userFromGalerie && userFromGalerie.GalerieUser.hasNewFrames) {
    try {
      await GalerieUser.update({
        hasNewFrames: false,
      }, {
        where: {
          userId: currentUser.id,
          galerieId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerie: {
        ...galerie.toJSON(),
        currentCoverPicture,
        frames: [],
        hasNewFrames: userFromGalerie
          ? userFromGalerie.GalerieUser.hasNewFrames
          : false,
        role: userFromGalerie
          ? userFromGalerie.GalerieUser.role
          : 'user',
        users: [],
      },
    },
  });
};
