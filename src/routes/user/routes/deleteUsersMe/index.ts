import { compare } from 'bcrypt';
import { Request, Response } from 'express';

import { Image, ProfilePicture, User } from '@src/db/models';

import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).send({
      errors: {
        password: FIELD_IS_REQUIRED,
      },
    });
  }
  const user = req.user as User;
  const PasswordsMatch = await compare(password, user.password);
  if (!PasswordsMatch) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }
  try {
    await user.destroy();
    const profilePictures = await ProfilePicture.findAll({
      where: {
        userId: user.id,
      },
    });
    try {
      await Promise.all(
        profilePictures.map(async ({
          id,
          cropedImageId,
          originalImageId,
          pendingImageId,
        }) => {
          const profilePicture = await ProfilePicture.findByPk(id);
          if (profilePicture) {
            await profilePicture.destroy();
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
          }
        }),
      );
    } catch (err) {
      return res.status(500).send(err);
    }
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
