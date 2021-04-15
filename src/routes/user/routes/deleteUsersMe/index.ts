import { compare } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
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
  const {
    deleteAccountSentence,
    password,
    userNameOrEmail,
  } = req.body;
  const user = req.user as User;

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
  if (!userNameOrEmail) {
    errors.userNameOrEmail = FIELD_IS_REQUIRED;
  } else if (
    userNameOrEmail !== user.email
    && `@${userNameOrEmail}` !== user.userName
  ) {
    errors.userNameOrEmail = 'wrong user name or email';
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }

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
      profilePictures.map(async (profilePicture) => {
        const {
          cropedImage,
          originalImage,
          pendingImage,
        } = profilePicture;
        await profilePicture.destroy();
        await Image.destroy({
          where: {
            [Op.or]: [
              {
                id: cropedImage.id,
              },
              {
                id: originalImage.id,
              },
              {
                id: pendingImage.id,
              },
            ],
          },
        });
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
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all tickets
  try {
    await Ticket.destroy({
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all frames/galeriePictures/images/likes
  // And images from Google buckets
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
        await frame.destroy();
        await Promise.all(
          frame.galeriePictures.map(async (galeriePicture) => {
            const {
              cropedImage,
              originalImage,
              pendingImage,
            } = galeriePicture;
            await galeriePicture.destroy();
            await Image.destroy({
              where: {
                [Op.or]: [
                  {
                    id: cropedImage.id,
                  },
                  {
                    id: originalImage.id,
                  },
                  {
                    id: pendingImage.id,
                  },
                ],
              },
            });
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
          }),
        );
        await Like.destroy({
          where: { frameId: frame.id },
        });
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all galerieUser related to this user.
  // If user is the creator of the galerie
  // and if is the only one left on this galerie
  // destroy this galerie.
  // Else, set this galerie as archive.
  try {
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
  } catch (err) {
    return res.status(500).send(err);
  }

  // destroy all invitations
  try {
    await Invitation.destroy({
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // destroy user
  try {
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
