// DELETE galeries/:galerieId/unsubscribe/

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
  Like,
  Notification,
  User,
} from '#src/db/models';

import {
  DEFAULT_ERROR_MESSAGE,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import gc from '#src/helpers/gc';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const { galerieId } = req.params;
  let framesLikeByCurrentUser: Frame[];
  let galerie: Galerie | null;
  let galerieUsers: GalerieUser[];
  let notificationsUserSubscribe: Notification[];

  // Check if request.params.userId
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

  // The admin of this galerie
  // cannot unsubscribe this one.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'admin') {
    return res.status(400).send({
      errors: 'you cannot unsubscribe a galerie you\'ve created',
    });
  }

  // Fetch all galerieUser...
  try {
    galerieUsers = await GalerieUser.findAll({
      where: {
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // ...and destroy the one of the currentUser.
  const galerieUser = galerieUsers
    .find((gu) => gu.userId === currentUser.id);
  if (galerieUser) {
    try {
      await galerieUser.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
  } else {
    return res.status(500).send({
      errors: DEFAULT_ERROR_MESSAGE,
    });
  }

  // .....................
  // If there is no more user
  // subscribe to this galerie...
  // .....................
  // If this is reach, this is suppose
  // to be a bug  if there is no more user left
  // the last user is suppose to be the admin
  // and this route is not suppose to be accessible
  // to it.
  if (galerieUsers.length - 1 < 1) {
    let frames: Frame[];

    try {
      frames = await Frame.findAll({
        include: [{
          all: true,
          include: [{
            all: true,
          }],
        }],
        where: {
          galerieId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }

    // Destroy all images from Google Buckets.
    try {
      await Promise.all(
        frames.map(async (frame) => {
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

    // Destroy galerie.
    try {
      await galerie.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }

  // .....................
  // If there is still users
  // remaining on this galerie....
  // .....................
  } else {
    try {
      // Fetch all frames posted by
      // this user on this galerie.
      const frames = await Frame.findAll({
        include: [{
          all: true,
          include: [{
            all: true,
          }],
        }],
        where: {
          galerieId,
          userId: currentUser.id,
        },
      });

      await Promise.all(
        frames.map(async (frame) => {
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

          // Destoy images from Google Bucket.
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

    // Set blackList.createdBy === null
    // to all blackList posted by this user.
    try {
      await GalerieBlackList.update({
        createdById: null,
      }, {
        where: {
          createdById: currentUser.id,
          galerieId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }

    // Fetch all likes.
    try {
      framesLikeByCurrentUser = await Frame.findAll({
        include: [
          {
            model: Like,
            where: {
              userId: currentUser.id,
            },
          },
        ],
        where: {
          galerieId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (framesLikeByCurrentUser) {
      try {
        await Promise.all(
          framesLikeByCurrentUser.map(
            async (frame) => {
              // Decrement frame.numOfLikes
              // for all frame liked by currentUser.
              await frame.decrement({ numOfLikes: 1 });

              // Destroy likes.
              await Promise.all(
                frame.likes.map(async (like) => {
                  await like.destroy();
                }),
              );

              // Fetch notification where
              // type === 'FRAME_LIKED', frameId === frame.id
              // and frameLiked.userId === currentUser.id exist.
              const notification = await Notification.findOne({
                include: [
                  {
                    as: 'notificationsFrameLiked',
                    model: User,
                    where: {
                      id: currentUser.id,
                    },
                  },
                ],
                where: {
                  frameId: frame.id,
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

    // Destroy all invitations
    // posted by currentUser.
    try {
      await Invitation.destroy({
        where: {
          galerieId,
          userId: currentUser.id,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }

    // Destroy all notifications
    // where galerieId === request.params.galerieId,
    // type === FRAME_POSTED || 'USER_SUBSCRIBE',
    // and userId === currentUser.id
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
          userId: currentUser.id,
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
              id: currentUser.id,
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
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId,
    },
  });
};
