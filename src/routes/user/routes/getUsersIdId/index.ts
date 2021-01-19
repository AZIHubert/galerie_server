import { Request, Response } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user: { id: userId } } = res.locals;
  if (id === userId) {
    return res.status(400).send({
      errors: 'params.id is the same as your current one',
    });
  }
  let user: User | null;
  try {
    user = await User.findOne({
      where: {
        id,
        confirmed: true,
      },
      attributes: {
        exclude: [
          'authTokenVersion',
          'confirmed',
          'confirmTokenVersion',
          'currentProfilePictureId',
          'email',
          'emailTokenVersion',
          'password',
          'resetPasswordTokenVersion',
          'updatedEmailTokenVersion',
        ],
      },
      include: [
        {
          model: ProfilePicture,
          as: 'currentProfilePicture',
          attributes: {
            exclude: [
              'userId',
              'originalImageId',
              'cropedImageId',
              'pendingImageId',
              'createdAt',
              'updatedAt',
            ],
          },
          include: [
            {
              model: Image,
              as: 'originalImage',
            },
            {
              model: Image,
              as: 'cropedImage',
            },
            {
              model: Image,
              as: 'pendingImage',
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  try {
    if (user.currentProfilePicture) {
      const {
        currentProfilePicture: {
          originalImage: {
            bucketName: originalImageBucketName,
            fileName: originalImageFileName,
          },
          cropedImage: {
            bucketName: cropedImageBucketName,
            fileName: cropedImageFileName,
          },
          pendingImage: {
            bucketName: pendingImageBucketName,
            fileName: pendingImageFileName,
          },
        },
      } = user;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      user.currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
      const cropedImageSignedUrl = await signedUrl(
        cropedImageBucketName,
        cropedImageFileName,
      );
      user.currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      user.currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(user);
};
