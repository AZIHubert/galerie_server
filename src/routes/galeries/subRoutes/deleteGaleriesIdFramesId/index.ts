// DELETE /galeries/:galerieId/frames/:frameId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Notification,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import gc from '#src/helpers/gc';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    frameId,
  } = req.params;
  const currentUser = req.user as User;
  const where: {
    id?: string;
  } = {};
  let galerie: Galerie | null;
  let galerieUser: GalerieUser | null;
  let notificationsFramePosted: Notification[];

  if (currentUser.role === 'user') {
    where.id = currentUser.id;
  }

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
      include: [
        {
          include: [
            {
              model: GaleriePicture,
              include: [
                {
                  all: true,
                },
              ],
            },
          ],
          model: Frame,
          required: false,
          where: {
            id: frameId,
          },
        },
        {
          model: User,
          where,
        },
      ],
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

  // Check if frame exist.
  if (!galerie.frames[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Fetch galerieUser
  // to know the role of the user
  // who post this frame.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId: galerie.frames[0].userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (
    // If currentUser.role === user.
    currentUser.role === 'user'
    && (
      // If currentUser do not have posted this frame.
      currentUser.id !== galerie.frames[0].userId
      && (
        (
          // If currentUser role for this galerie is user.
          !userFromGalerie
          || userFromGalerie.GalerieUser.role === 'user'
        ) || (
          // If the user who have posted this frame
          // is the creator of the galerie.
          galerieUser
          && galerieUser.role === 'creator'
        )
      )
    )
  ) {
    return res.status(400).send({
      errors: 'your not allow to delete this frame',
    });
  }

  // Update or destroy notifications
  // where notification.framePosted.frameId === frameId.
  try {
    notificationsFramePosted = await Notification.findAll({
      include: [
        {
          as: 'notificationsFramePosted',
          model: Frame,
          where: {
            id: frameId,
          },
        },
      ],
      where: {
        type: 'FRAME_POSTED',
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  try {
    await Promise.all(
      notificationsFramePosted.map(
        async (notification) => {
          if (notification.num <= 1) {
            await notification.destroy();
          } else {
            await notification.decrement({ num: 1 });
            await notification.notificationsFramePosted[0].destroy();
          }
        },
      ),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destoy frame and Google Bucket Images.
  try {
    await galerie.frames[0].destroy();
    await Promise.all(
      galerie.frames[0].galeriePictures.map(
        async (galeriePicture) => {
          const {
            originalImage,
            cropedImage,
            pendingImage,
          } = galeriePicture;

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
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      frameId,
      galerieId,
    },
  });
};
