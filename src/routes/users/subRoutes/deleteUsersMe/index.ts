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
  Invitation,
  Like,
  ProfilePicture,
  Ticket,
  User,
} from '@src/db/models';

import {
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import {
  normalizeJoiErrors,
  validateDeleteUserMeBody,
} from '@src/helpers/schemas';
import validatePassword from '@src/helpers/validatePassword';

export default async (req: Request, res: Response) => {
  const user = req.user as User;

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
        await Promise.all(
          frame.galeriePictures.map(
            async (galeriePicture) => {
              const {
                cropedImage,
                originalImage,
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
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // .....................
  // Galeries/GalerieUsers
  // .....................
  // Destroy all galerieUser related to this user.
  // If user is the creator of the galerie
  // and if it is the only one left on this galerie,
  // destroy this galerie.
  // Else, set this galerie as archived.
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
            galerieId: galerieUser.galerieId,
          },
        });
        // If a user is the last
        // user subscribe to a galerie
        // destroy the galerie.
        if (allUsers.length <= 1) {
          await Galerie.destroy({
            where: {
              id: galerieUser.galerieId,
            },
          });

        // If there is still users subscribe to it
        // and currentUser was the creator of this galerie.
        // set galerie.archived to true
        // and destroy all invitations of this galerie.
        } else if (galerieUser.role === 'creator') {
          await Galerie.update({
            archived: true,
          }, {
            where: {
              id: galerieUser.galerieId,
            },
          });
          await Invitation.destroy({
            where: {
              galerieId: galerieUser.galerieId,
            },
          });
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
            pendingImage,
          } = profilePicture;
          await gc
            .bucket(cropedImage.bucketName)
            .file(cropedImage.fileName)
            .delete();
          await gc
            .bucket(originalImage.bucketName)
            .file(originalImage.fileName)
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
  });
};
