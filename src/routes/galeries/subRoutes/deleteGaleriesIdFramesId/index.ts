import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  Like,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    frameId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let frame: Frame | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.galerieId
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
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Fetch frame.
  try {
    frame = await Frame.findOne({
      include: [{
        model: GaleriePicture,
        include: [{
          all: true,
        }],
      }],
      where: {
        id: frameId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist.
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Only creator/admin or the user
  // who post the frame can deleted it.
  const { role } = galerie
    .users
    .filter((user) => user.id === currentUser.id)[0]
    .GalerieUser;
  if (
    currentUser.id !== frame.userId
    && role === 'user'
  ) {
    return res.status(400).send({
      errors: 'your not allow to delete this frame',
    });
  }

  // Destroy all frames/galerieImages/images
  // /images from Google Buckets/likes.
  try {
    await frame.destroy();

    await Like.destroy({
      where: { frameId },
    });

    await Promise.all(
      frame.galeriePictures.map(
        async (galeriePicture) => {
          const {
            originalImage,
            cropedImage,
            pendingImage,
          } = galeriePicture;

          await Image.destroy({
            where: {
              [Op.or]: [
                {
                  id: cropedImage.id,
                },
                {
                  id: originalImage.id,
                },
                {
                  id: pendingImage.id,
                },
              ],
            },
          });

          // Delete files from Google Buckets.
          await gc
            .bucket(originalImage.bucketName)
            .file(originalImage.fileName)
            .delete();
          await gc
            .bucket(cropedImage.bucketName)
            .file(cropedImage.fileName)
            .delete();
          await gc
            .bucket(pendingImage.bucketName)
            .file(pendingImage.fileName)
            .delete();
        },
      ),
    );
  } catch (err) {
    return res.status(500).end();
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      frameId,
      galerieId,
    },
  });
};
