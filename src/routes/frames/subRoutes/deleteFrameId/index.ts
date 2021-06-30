// DELETE /frames/:frameId/

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
    frameId,
  } = req.params;
  const currentUser = req.user as User;
  const where: {
    id?: string;
  } = {};
  let frame: Frame | null;
  let galerieUser;
  let notificationsFramePosted: Notification[];

  if (currentUser.role === 'user') {
    where.id = currentUser.id;
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
    frame = await Frame.findByPk(frameId, {
      include: [
        {
          model: GaleriePicture,
          include: [
            {
              all: true,
            },
          ],
        },
        {
          include: [
            {
              model: User,
              required: currentUser.role === 'user',
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
      ],
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

  if (currentUser.id !== frame.userId) {
    try {
      galerieUser = await GalerieUser.findOne({
        where: {
          galerieId: frame.galerieId,
          userId: frame.userId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  if (
    // If currentUser.role === user.
    currentUser.role === 'user'
    && (
      // If currentUser do not have posted this frame.
      currentUser.id !== frame.userId
      && (
        // If currentUser role for this galerie is user.
        frame.galerie.users[0].GalerieUser.role === 'user'
        || (
          // If the user who have posted this frame
          // is the admin of the galerie.
          galerieUser
          && galerieUser.role === 'admin'
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
    await frame.destroy();
    await Promise.all(
      frame.galeriePictures.map(
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
      galerieId: frame.galerieId,
    },
  });
};
