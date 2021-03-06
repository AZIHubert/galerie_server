// POST /galeries/:galerieId/users/:userId/blackLists/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  GalerieBlackList,
  GaleriePicture,
  Invitation,
  Notification,
  Like,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  galerieBlackListExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import gc from '#src/helpers/gc';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    userId,
  } = req.params;
  const currentUser = req.user as User;
  const objectUserExcluder: { [key:string]: undefined} = {};
  const objectGalerieBlackListExcluder: { [key:string]: undefined} = {};
  let galerie: Galerie | null;
  let galerieBlackList: GalerieBlackList;
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

  // Check that currentUser.id !== userId
  if (currentUser.id === userId) {
    return res.status(400).send({
      errors: 'you can\'t black list yourself',
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

  // Check if currentUser
  // is the admin or an moderator
  // of this galerie.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to black list a user from this galerie',
    });
  }

  // TODO: for later
  // when request created
  // if(!user)
  // find user with galerieBlackList where galerieId === galerieId

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [
        {
          as: 'frames',
          include: [
            {
              include: [
                {
                  all: true,
                },
              ],
              model: GaleriePicture,
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
          as: 'galerieBlackListsUser',
          limit: 1,
          model: GalerieBlackList,
          required: false,
          where: {
            galerieId,
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
          required: false,
          model: Like,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // The admin of this galerie can\'t be blackListed.
  const galerieFromUser = user.galeries
    .find((u) => u.id === galerieId);
  if (!galerieFromUser || galerieFromUser.GalerieUser.role === 'admin') {
    return res.status(400).send({
      errors: 'the admin of this galerie can\'t be black listed',
    });
  }

  // Only the admin of this galerie
  // is allow to blackList an moderator
  // of the galerie.
  if (
    galerieFromUser.GalerieUser.role === 'moderator'
    && userFromGalerie.GalerieUser.role === 'moderator'
  ) {
    return res.status(400).send({
      errors: 'you\re not allow to black list an moderator',
    });
  }

  // Check that user is not
  // already blackList from this galerie.
  if (user.galerieBlackListsUser[0]) {
    // If this error is reached
    // it mean that black listed user
    // has a galerieUser for the galerie
    // he is supposed to be blackListed.
    // This is a bug, so we destroy his
    // galerieUser for this galerie.
    try {
      await galerieFromUser.GalerieUser.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(400).send({
      errors: 'this user is already black listed from this galerie',
    });
  }

  // Destroy galerieUser.
  try {
    await galerieFromUser.GalerieUser.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  if (user.frames) {
    try {
      await Promise.all(
        user.frames.map(
          async (frame) => {
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
                    cropedImage,
                    originalImage,
                  } = galeriePicture;

                  await gc
                    .bucket(cropedImage.bucketName)
                    .file(cropedImage.fileName)
                    .delete();
                  await gc
                    .bucket(originalImage.bucketName)
                    .file(originalImage.fileName)
                    .delete();
                },
              ),
            );
          },
        ),
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
      try {
        await Promise.all(
          user.likes.map(async (like) => {
            await like.frame.decrement({ numOfLikes: 1 });
            like.destroy();

            // Fetch notification where
            // type === 'FRAME_LIKED', frameId === frame.id
            // and frameLiked.userId === currentUser.id exist.
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
          }),
        );
      } catch (err) {
        return res.status(500).send(err);
      }
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  // Destroy invitation posted by deleted user.
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

  try {
    galerieBlackList = await GalerieBlackList.create({
      createdById: currentUser.id,
      galerieId,
      userId: user.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  galerieBlackListExcluder.forEach((e) => {
    objectGalerieBlackListExcluder[e] = undefined;
  });

  const normalizeGalerieBlackList = {
    ...galerieBlackList.toJSON(),
    ...objectGalerieBlackListExcluder,
    createdBy: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
      hasNewNotifications: undefined,
    },
    user: {
      ...user.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
      hasNewNotifications: undefined,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieBlackList: normalizeGalerieBlackList,
      galerieId,
      userId,
    },
  });
};
