import { compare } from 'bcrypt';
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
  Invitation,
  Like,
  ProfilePicture,
  Ticket,
  User,
} from '@src/db/models';

import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  const {
    deleteAccountSentence,
    password,
    userNameOrEmail,
  } = req.body;

  // Check if user is made with google or facebook
  // if true, the user can't delete his account
  // you need a password for it
  // but accont created with Google or Facebook doesn't have one
  if (user.facebookId || user.googleId) {
    return res.status(400).send({
      errors: 'you can\'t delete your account if you\'re logged in with Facebook or Google',
    });
  }

  // return error if
  // deleteAccountSentence/userNameOrEmail/password
  // are not send or not match
  const errors: {
    deleteAccountSentence?: string;
    password?: string;
    userNameOrEmail?: string;
  } = {};
  if (!userNameOrEmail) {
    errors.userNameOrEmail = FIELD_IS_REQUIRED;
  } else if (
    userNameOrEmail !== user.email
    && `@${userNameOrEmail}` !== user.userName
  ) {
    errors.userNameOrEmail = 'wrong user name or email';
  }
  if (!deleteAccountSentence) {
    errors.deleteAccountSentence = FIELD_IS_REQUIRED;
  } else if (deleteAccountSentence !== 'delete my account') {
    errors.deleteAccountSentence = 'wrong sentence';
  }
  if (!password) {
    errors.password = FIELD_IS_REQUIRED;
  } else {
    let passwordsMatch: boolean;
    try {
      passwordsMatch = await compare(password, user.password);
      if (!passwordsMatch) {
        errors.password = WRONG_PASSWORD;
      }
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }

  try {
    // Destroy all Profile Pictures
    const profilePictures = await ProfilePicture.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      profilePictures.map(async ({
        cropedImageId,
        id,
        originalImageId,
        pendingImageId,
      }) => {
        const profilePicture = await ProfilePicture.findByPk(id);
        if (profilePicture) {
          await profilePicture.update({
            cropedImageId: null,
            originalImageId: null,
            pendingImageId: null,
          });
          const originalImage = await Image.findByPk(originalImageId);
          if (originalImage) {
            await originalImage.destroy();
            await gc
              .bucket(originalImage.bucketName)
              .file(originalImage.fileName)
              .delete();
          }
          const cropedImage = await Image.findByPk(cropedImageId);
          if (cropedImage) {
            await cropedImage.destroy();
            await gc
              .bucket(cropedImage.bucketName)
              .file(cropedImage.fileName)
              .delete();
          }
          const pendingImage = await Image.findByPk(pendingImageId);
          if (pendingImage) {
            await pendingImage.destroy();
            await gc
              .bucket(pendingImage.bucketName)
              .file(pendingImage.fileName)
              .delete();
          }
          await profilePicture.destroy();
        }
      }),
    );

    // Destroy all tickets
    await Ticket.destroy({
      where: {
        userId: user.id,
      },
    });

    // Destroy all frames/likes/galeriePictures/images
    // And images from Google buckets
    const frames = await Frame.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(frames.map(async (frame) => {
      const galeriePictures = await GaleriePicture.findAll({
        include: [{
          all: true,
        }],
        where: {
          frameId: frame.id,
        },
      });
      await Promise.all(
        galeriePictures.map(async (galeriePicture) => {
          const {
            cropedImage,
            originalImage,
            pendingImage,
          } = galeriePicture;
          await galeriePicture.destroy();
          await gc
            .bucket(originalImage.bucketName)
            .file(originalImage.fileName)
            .delete();
          await Image.destroy({
            where: {
              id: originalImage.id,
            },
          });
          await gc
            .bucket(cropedImage.bucketName)
            .file(cropedImage.fileName)
            .delete();
          await Image.destroy({
            where: {
              id: cropedImage.id,
            },
          });
          await gc
            .bucket(pendingImage.bucketName)
            .file(pendingImage.fileName)
            .delete();
          await Image.destroy({
            where: {
              id: pendingImage.id,
            },
          });
        }),
      );
      await Like.destroy({
        where: { frameId: frame.id },
      });
      await frame.destroy();
    }));

    // Destroy all galerieUser related to this user.
    // If user is the creator of the galerie
    // and if is the only one left on this galerie
    // destroy this galerie.
    // Else, set this galerie as archive.
    const galerieUsers = await GalerieUser.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(galerieUsers.map(async (galerieUser) => {
      await galerieUser.destroy();
      const allUsers = await GalerieUser.findAll({
        where: {
          galerieId: galerieUser.galerieId,
        },
      });
      if (galerieUser.role === 'creator') {
        if (!allUsers.length) {
          await Galerie.destroy({
            where: {
              id: galerieUser.galerieId,
            },
          });
        } else {
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
      }
    }));

    // destroy all invitations
    await Invitation.destroy({
      where: {
        userId: user.id,
      },
    });

    // destroy user
    await user.destroy();
  } catch (err) {
    return res.status(500).send();
  }

  // destroy session and log out
  req.logOut();
  req.session.destroy((sessionError) => {
    if (sessionError) {
      res.status(401).send({
        errors: sessionError,
      });
    }
  });
  return res.status(204).end();
};
