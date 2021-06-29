// GET /galeries/:galerieId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  const where: {
    id?: string
  } = {};
  let galerie: Galerie | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  if (currentUser.role === 'user') {
    where.id = currentUser.id;
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
        where,
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

  const normalizeGalerie = {
    ...galerie.toJSON(),
    allowNotification: userFromGalerie
      ? userFromGalerie.GalerieUser.allowNotification
      : null,
    currentCoverPicture: null,
    frames: [],
    hasNewFrames: userFromGalerie
      ? userFromGalerie.GalerieUser.hasNewFrames
      : null,
    role: userFromGalerie
      ? userFromGalerie.GalerieUser.role
      : null,
    users: [],
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      galerie: normalizeGalerie,
    },
  });
};
