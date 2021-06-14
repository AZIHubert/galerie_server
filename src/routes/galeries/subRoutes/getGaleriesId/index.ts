// GET /galeries/:galerieId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  galeriePictureExcluder,
} from '@src/helpers/excluders';
import fetchFrame from '@src/helpers/fetchFrame';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  let currentCoverPicture: Frame | null;
  let galerie: Galerie | null;
  let normalizeCurrentCoverPicture;

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

  // Fetch currentCoverPicture.
  try {
    currentCoverPicture = await Frame.findOne({
      include: [{
        attributes: {
          exclude: galeriePictureExcluder,
        },
        include: [
          {
            as: 'cropedImage',
            model: Image,
          },
          {
            as: 'originalImage',
            model: Image,
          },
          {
            as: 'pendingImage',
            model: Image,
          },
        ],
        model: GaleriePicture,
        where: {
          current: true,
        },
      }],
      where: {
        galerieId: galerie.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch signed url if galerie have cover picture.
  if (currentCoverPicture) {
    try {
      normalizeCurrentCoverPicture = await fetchFrame(currentCoverPicture);
    } catch (err) {
      return res.status(500).send(err);
    }
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
        currentCoverPicture: normalizeCurrentCoverPicture
          ? normalizeCurrentCoverPicture.galeriePictures[0]
          : null,
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
