import { compare } from 'bcrypt';
import { Request, Response } from 'express';

import {
  Image,
  GalerieUser,
  ProfilePicture,
  Ticket,
  User,
  Invitation,
  Like,
  Galerie,
  Frame,
  GaleriePicture,
} from '@src/db/models';

import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  if (user.facebookId || user.googleId) {
    return res.status(400).send({
      errors: 'you can\'t delete your account if you\'re logged in with Facebook or Google',
    });
  }
  const {
    deleteAccountSentence,
    password,
    userNameOrEmail,
  } = req.body;
  if (!password) {
    return res.status(400).send({
      errors: {
        password: FIELD_IS_REQUIRED,
      },
    });
  }
  const errors: {
    deleteAccountSentence?: string;
    userNameOrEmail?: string;
    password?: string;
  } = {};
  if (userNameOrEmail !== user.email && `@${userNameOrEmail}` !== user.userName) {
    errors.userNameOrEmail = 'wrong user name or email';
  }
  if (deleteAccountSentence !== 'delete my account') {
    errors.deleteAccountSentence = 'wrong sentence';
  }
  let passwordsMatch: boolean;
  try {
    passwordsMatch = await compare(password, user.password);
    if (!passwordsMatch) {
      errors.password = WRONG_PASSWORD;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }
  try {
    await user.update({ currentProfilePictureId: null });
    const profilePictures = await ProfilePicture.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      profilePictures.map(async ({
        id,
        cropedImageId,
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
    const tickets = await Ticket.findAll({
      where: {
        userId: user.id,
      },
    });
    await Promise.all(
      tickets.map(async (ticket) => {
        await ticket.update({ userId: null });
      }),
    );
    const galerieUsers = await GalerieUser.findAll({
      where: {
        userId: user.id,
      },
    });
    const frames = await Frame.findAll({
      where: {
        userId: user.id,
      },
    });

    await Promise.all(frames.map(async (frame) => {
      const galeriePictures = await GaleriePicture.findAll({
        where: {
          frameId: frame.id,
        },
        include: [
          {
            all: true,
          },
        ],
      });
      await Promise.all(
        galeriePictures.map(async (galeriePicture) => {
          const {
            originalImage,
            cropedImage,
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
        where: { frameId: '1' },
      });
      await frame.destroy();
    }));
    let galerie: Galerie | null;
    await Promise.all(galerieUsers.map(async (galerieUser) => {
      await galerieUser.destroy();
      if (galerieUser.role === 'creator') {
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
      galerie = await Galerie.findByPk(galerieUser.galerieId);
      const allUsers = await GalerieUser.findAll({
        where: {
          galerieId: galerieUser.galerieId,
        },
      });
      if (galerie) {
        if (!allUsers.length) {
          await galerie.destroy();
        } else if (
          galerie
          && frames.map((frame) => frame.id).includes(galerie.coverPictureId)
        ) {
          await galerie.update({ coverPictureId: null });
        }
      }
    }));
    await Invitation.destroy({
      where: {
        userId: user.id,
      },
    });
    await user.destroy();
  } catch (err) {
    return res.status(500).send();
  }
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
