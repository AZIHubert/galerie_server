// DELETE /galeries/:galerieId/users/:userId/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  GalerieBlackList,
  GalerieUser,
  Invitation,
  Notification,
  Like,
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
    userId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let notificationsUserSubscribe: Notification[];
  let user: User | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Check if current user.id and req.params.userId
  // are not similar.
  if (currentUser.id === userId) {
    return res.status(400).send({
      errors: 'you cannot delete yourself',
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

  // Check if user's role for this galerie
  // is not user.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you should be an moderator or the admin of this galerie to delete a user',
    });
  }

  // Fetch user.
  try {
    user = await User.findOne({
      where: {
        id: userId,
      },
      include: [
        {
          as: 'frames',
          include: [
            {
              all: true,
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
            galerieId,
          },
        },
        {
          model: Galerie,
          where: {
            id: galerieId,
          },
        },
        {
          include: [
            {
              model: Frame,
              where: {
                galerieId,
              },
            },
          ],
          model: Like,
          required: false,
        },
      ],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  // Check if user exist
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // The admin of this galerie cannot
  // be deleted.
  const galerieFromUser = user.galeries
    .find((g) => g.id === galerieId);
  if (!galerieFromUser || galerieFromUser.GalerieUser.role === 'admin') {
    return res.status(400).send({
      errors: 'you can\'t delete the admin of this galerie',
    });
  }

  // An moderator cannot delete
  // another moderator.
  if (
    (
      !galerieFromUser
      || galerieFromUser.GalerieUser.role === 'moderator'
    )
    && userFromGalerie.GalerieUser.role === 'moderator'
  ) {
    return res.status(400).send({
      errors: 'you should be the admin of this galerie to delete an moderator',
    });
  }

  // Destroy galerieUser.
  try {
    await GalerieUser.destroy({
      where: {
        userId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all frames/galeriePictures/images
  // images from Google Buckets/likes.
  if (user.frames) {
    try {
      await Promise.all(
        user.frames.map(async (frame) => {
          // Destroy or decrement num
          // for all notification
          // where type === 'FRAME_POSTED'
          // and notificationsFramePosted.frameId === frame.id
          const notifications = await Notification.findAll({
            include: [{
              as: 'notificationsFramePosted',
              model: Frame,
              where: {
                id: frame.id,
              },
            }],
            where: {
              type: 'FRAME_POSTED',
            },
          });
          await Promise.all(
            notifications.map(
              async (notification) => {
                if (notification.num <= 1) {
                  await notification.destroy();
                } else {
                  await notification.decrement({ num: 1 });
                }
              },
            ),
          );

          // Destroy frame.
          await frame.destroy();

          // Destroy images from Google Bucket.
          await Promise.all(
            frame.galeriePictures.map(
              async (galeriePicture) => {
                const {
                  originalImage,
                  cropedImage,
                  pendingImage,
                } = galeriePicture;

                await gc
                  .bucket(pendingImage.bucketName)
                  .file(pendingImage.fileName)
                  .delete();
                await gc
                  .bucket(originalImage.bucketName)
                  .file(originalImage.fileName)
                  .delete();
                await gc
                  .bucket(cropedImage.bucketName)
                  .file(cropedImage.fileName)
                  .delete();
              },
            ),
          );
        }),
      );
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  // Set createdById === nul for all galerieBlackList
  // posted by deleted user
  try {
    await GalerieBlackList.update({
      createdById: null,
    }, {
      where: {
        galerieId,
        createdById: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all likes post by
  // deleted user on this galerie.
  // and decrement frames.numOfLikes.
  if (user.likes) {
    try {
      await Promise.all(
        user.likes.map(
          async (like) => {
            // Decrement numOfLike
            // for all frame liked by deleted user.
            await like.frame.decrement({ numOfLikes: 1 });

            // Destoy Like
            await like.destroy();

            // Fetch notification where
            // type === 'FRAME_LIKED', frameId === frame.id
            // and frameLiked.userId === deleted user.id exist.
            const notification = await Notification.findOne({
              include: [
                {
                  as: 'notificationsFrameLiked',
                  model: User,
                  where: {
                    id: userId,
                  },
                },
              ],
              where: {
                frameId: like.frameId,
                type: 'FRAME_LIKED',
              },
            });

            // If notification exist and
            // num <= 1, destroy it,
            // else destroy through model and decrement num.
            if (notification) {
              if (notification.num <= 1) {
                await notification.destroy();
              } else {
                await notification.decrement({ num: 1 });
                await notification.notificationsFrameLiked[0].destroy();
              }
            }
          },
        ),
      );
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  // Destroy invitation
  // posted by deleted user.
  try {
    await Invitation.destroy({
      where: {
        galerieId,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all notification where
  // types === 'FRAME_POSTED' || 'USER_SUBSCRIBE
  // userId === request.params.userId
  // galerieId === request.params.galerieId
  try {
    await Notification.destroy({
      where: {
        galerieId,
        type: {
          [Op.or]: [
            'FRAME_POSTED',
            'USER_SUBSCRIBE',
          ],
        },
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch all notifications
  // where type === 'USER_SUBSCRIBE',
  // galerieId === request.params.galerieId
  // and usersSubscribe.id === currentUser.id.
  try {
    notificationsUserSubscribe = await Notification.findAll({
      include: [
        {
          as: 'usersSubscribe',
          model: User,
          where: {
            id: userId,
          },
        },
      ],
      where: {
        galerieId,
        type: 'USER_SUBSCRIBE',
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  // If notification.num <= 1 destroy it,
  // else, delete though model and decrement num.
  try {
    await Promise.all(
      notificationsUserSubscribe.map(
        async (notification) => {
          if (notification.num <= 1) {
            await notification.destroy();
          } else {
            await notification.usersSubscribe[0].destroy();
            await notification.decrement({ num: 1 });
          }
        },
      ),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId,
      userId,
    },
  });
};
