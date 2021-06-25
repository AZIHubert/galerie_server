// DELETE galeries/:galerieId/unsubscribe/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GalerieBlackList,
  GalerieUser,
  Invitation,
  Like,
  Notification,
  User,
} from '@src/db/models';

import {
  DEFAULT_ERROR_MESSAGE,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const { galerieId } = req.params;
  let framesLikeByCurrentUser: Frame[];
  let galerie: Galerie | null;
  let galerieUsers: GalerieUser[];

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

  // The creator of this galerie
  // cannot unsubscribe this one.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'creator') {
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

  // ...and destroy the one of the current user.
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

  // If there is no more user
  // subscribe to this galerie...
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

                // ...destroy all images
                // from Google Buckets...
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

    // ...and destroy galerie.
    try {
      await galerie.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }

  // If there is still users
  // remain on this galerie....
  } else {
    // set blackList.createdBy === null
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

    try {
      // ...fetch all frames posted by
      // this user on this galerie...
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

      // ...and destoy them with their
      // Google Bucket images...
      await Promise.all(
        frames.map(async (frame) => {
          await frame.destroy();
          // TODO:
          // destroy all notification
          // where
          //  type === 'FRAME_POSTED'
          //  num <= 1
          // include frame as notificationFramePosted
          // where
          //  frameId === galerie.frames[0].id
          // decrement notification.num
          // where
          //  type === 'FRAME_POSTED'
          //   frame as notificationFramePosted
          //   where
          //    frameId === frame.id

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

    // ...destroy all likes posted
    // (and decrement frame.numOfLikes)
    // by this user...
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
              await frame.decrement({ numOfLikes: 1 });

              // TODO:
              // Destroy all notifications
              // where
              //  type === 'FRAME_LIKED'
              //  num <= 1
              //  frameId === frame.id
              // update all notifications
              // where
              //  type === 'FRAME_LIKED'
              //  frameId === frame.id

              // Check if notification where type === 'FRAME_LIKED' exist.
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

              // if notification exist
              // destroy the through Model.
              if (notification) {
                await notification.notificationsFrameLiked[0].destroy();
              }

              await Promise.all(
                frame.likes.map(async (like) => {
                  // Check if notification where type === 'FRAME_LIKED' exist.
                  await like.destroy();
                }),
              );
            },
          ),
        );

        // TODO:
        // fetch all notifications
        // where
        //  type === 'USER_SUBSCRIBE'
        //  galerieId === request.params.galeriId
        // include user as notificationUserSubscribe
        // where
        //  userId === currentUser.id
        // foreach notifications
        //  if notification.num <= 1
        //    destroy notification
        //  else
        //    decrement notification.num
        //  foreach notificationUserSubscribes
        //    destroy notificationUserSubscribe
      } catch (err) {
        return res.status(500).send(err);
      }
    }

    // ...and destroy all invitations
    // posted by this user.
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
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId,
    },
  });
};
