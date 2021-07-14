// DELETE /users/me/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BetaKey,
  BlackList,
  Frame,
  Galerie,
  GalerieBlackList,
  GalerieUser,
  Like,
  Notification,
  ProfilePicture,
  Ticket,
  User,
} from '#src/db/models';

import {
  WRONG_PASSWORD,
} from '#src/helpers/errorMessages';
import gc from '#src/helpers/gc';
import { signNotificationToken } from '#src/helpers/issueJWT';
import {
  normalizeJoiErrors,
  validateDeleteUserMeBody,
} from '#src/helpers/schemas';
import validatePassword from '#src/helpers/validatePassword';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  let notificationsUserSubscribe: Notification[];
  let notificationBetaKeyUsed: Notification | null;
  let notificationToken;

  // Check if user is created with Google or Facebook.
  // If true, the user can't delete his account.
  // (you need a password for it,
  // but account created with Google or Facebook doesn't have one).
  if (!!user.facebookId || !!user.googleId) {
    return res.status(400).send({
      errors: 'you can\'t delete your account if you\'re logged in with Facebook or Google',
    });
  }

  // Check if request.body is valid.
  const {
    error,
    value,
  } = validateDeleteUserMeBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Return error if
  // deleteAccountSentence/userNameOrEmail/password
  // are not send or not match.
  const errors: {
    deleteAccountSentence?: string;
    password?: string;
    userNameOrEmail?: string;
  } = {};
  if (value.deleteAccountSentence !== 'delete my account') {
    errors.deleteAccountSentence = 'wrong sentence';
  }
  try {
    const passwordIsValid = validatePassword(value.password, user.hash, user.salt);
    if (!passwordIsValid) {
      errors.password = WRONG_PASSWORD;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  if (
    value.userNameOrEmail !== user.email
    && `@${value.userNameOrEmail}` !== user.userName
  ) {
    errors.userNameOrEmail = 'wrong user name or email';
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }

  // .....................
  // BetaKeys
  // .....................
  // set betaKey.createdById === null
  // to all used betaKey created by current user.
  try {
    await BetaKey.update({
      createdById: null,
    }, {
      where: {
        createdById: user.id,
        userId: {
          [Op.not]: null,
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // BlackLists
  // .....................
  // Put blackList.createdById to null where
  // blackList.createdById === currentUser.id.
  try {
    await BlackList.update(
      { createdById: null },
      {
        where: {
          createdById: user.id,
        },
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  // Put blackList.updatedById to null
  // where blackList.updatedById === currentUser.id.
  try {
    await BlackList.update(
      { updatedById: null },
      {
        where: {
          updatedById: user.id,
        },
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // Frames
  // .....................
  // Destroy all frames/galeriePictures/images
  // likes post on frames and images from Google buckets.
  try {
    const frames = await Frame.findAll({
      include: [{
        all: true,
        include: [{
          all: true,
        }],
      }],
      where: {
        userId: user.id,
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

        await Promise.all(
          frame.galeriePictures.map(
            async (galeriePicture) => {
              const {
                cropedImage,
                originalImage,
              } = galeriePicture;
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

  // .....................
  // Galeries/GalerieUsers
  // .....................
  // Destroy all galerieUser related to this user.
  // If user is the admin of the galerie
  // and if it is the only one left on this galerie,
  // destroy this galerie.
  try {
    const galerieUsers = await GalerieUser.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      galerieUsers.map(async (galerieUser) => {
        const allUsers = await GalerieUser.findAll({
          where: {
            userId: {
              [Op.not]: user.id,
            },
            galerieId: galerieUser.galerieId,
          },
        });
        // If a user is the last
        // user subscribe to a galerie
        // destroy the galerie.
        if (allUsers.length <= 0) {
          await Galerie.destroy({
            where: {
              id: galerieUser.galerieId,
            },
          });
        // Else pick a random moderator
        // (or a random user if no moderator)
        // to be the new admin,
        // and create a notificationToken.
        } else if (galerieUser.role === 'admin') {
          const allModerators = allUsers.filter((u) => u.role === 'moderator');
          if (allModerators.length) {
            const randomModerator = allModerators[
              Math.floor(Math.random() * allModerators.length)
            ];
            await randomModerator.update({
              role: 'admin',
            });
            const signToken = signNotificationToken('GALERIE_ROLE_CHANGE', {
              galerieId: randomModerator.galerieId,
              role: 'admin',
              userId: randomModerator.userId,
            });
            notificationToken = signToken.token;
          } else {
            const randomUser = allUsers[
              Math.floor(Math.random() * allUsers.length)
            ];
            await randomUser.update({
              role: 'admin',
            });
            const signToken = signNotificationToken('GALERIE_ROLE_CHANGE', {
              galerieId: randomUser.galerieId,
              role: 'admin',
              userId: randomUser.userId,
            });
            notificationToken = signToken.token;
          }
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // GalerieBlackLists
  // .....................
  // Set galerieBlackList.createdById === null
  // for all galerieBlackLists created by
  // this user.
  try {
    await GalerieBlackList.update({
      createdById: null,
    }, {
      where: {
        createdById: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // Likes
  // .....................
  // Destroy all likes and decrement there
  // relative frame.
  try {
    const likes = await Like.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      likes.map(async (like) => {
        // Fetch notification where
        // type === 'FRAME_LIKED', frameId === frame.id
        // and frameLiked.userId === currentUser.id exist.
        const notification = await Notification.findOne({
          include: [
            {
              as: 'notificationsFrameLiked',
              model: User,
              where: {
                id: user.id,
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

        await Frame.increment({
          numOfLikes: -1,
        }, {
          where: {
            id: like.id,
          },
        });
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // Notifications
  // .....................
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
            id: user.id,
          },
        },
      ],
      where: {
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

  // Fetch notification
  // where type === 'BETA_KEY_USED',
  // bataLeyUsed.userId === request.params.userId
  try {
    notificationBetaKeyUsed = await Notification.findOne({
      include: [
        {
          as: 'notificationsBetaKeyUsed',
          model: User,
          where: {
            id: user.id,
          },
        },
      ],
      where: {
        type: 'BETA_KEY_USED',
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // If notification.num <= 1 destroy it,
  // else, delete though model and decrement num.
  if (notificationBetaKeyUsed) {
    if (notificationBetaKeyUsed.num <= 1) {
      try {
        await notificationBetaKeyUsed.destroy();
      } catch (err) {
        return res.status(500).send(err);
      }
    } else {
      try {
        await notificationBetaKeyUsed.decrement({ num: 1 });
      } catch (err) {
        return res.status(500).send(err);
      }
    }
  }

  // .....................
  // ProfilePictures
  // .....................
  // Destroy all profile pictures/images
  // and images from Google buckets.
  try {
    const profilePictures = await ProfilePicture.findAll({
      include: [
        {
          all: true,
        },
      ],
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      profilePictures.map(
        async (profilePicture) => {
          const {
            cropedImage,
            originalImage,
          } = profilePicture;
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
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // Tickets
  // .....................
  // set Ticket.userId to null
  // if current user is the author
  // of the ticket.
  try {
    await Ticket.update({
      userId: null,
    }, {
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy user.
  try {
    await user.destroy();
  } catch (err) {
    return res.status(500).send();
  }

  // Destroy session and log out.
  req.logOut();
  req.session.destroy((sessionError) => {
    if (sessionError) {
      res.status(401).send({
        errors: sessionError,
      });
    }
  });

  return res.status(200).send({
    action: 'DELETE',
    data: {
      notificationToken,
    },
  });
};
