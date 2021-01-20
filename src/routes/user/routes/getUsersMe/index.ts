import { Request, Response } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (_req: Request, res: Response) => {
  const { user: { id } } = res.locals;
  const user = await User.findByPk(id, {
    attributes: {
      exclude: [
        'blackListed',
        'confirmed',
        'password',
        'currentProfilePictureId',
        'authTokenVersion',
        'confirmTokenVersion',
        'emailTokenVersion',
        'updatedEmailTokenVersion',
        'resetPasswordTokenVersion',
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
      {
        model: ProfilePicture,
        as: 'profilePictures',
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
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  if (user.currentProfilePicture) {
    try {
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
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  if (user.profilePictures.length) {
    try {
      await Promise.all(user.profilePictures.map(async (profilePicture, index) => {
        const {
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
        } = profilePicture;
        const originalImageSignedUrl = await signedUrl(
          originalImageBucketName,
          originalImageFileName,
        );
        user.profilePictures[index].originalImage.signedUrl = originalImageSignedUrl;
        const cropedImageSignedUrl = await signedUrl(
          cropedImageBucketName,
          cropedImageFileName,
        );
        user.profilePictures[index].cropedImage.signedUrl = cropedImageSignedUrl;
        const pendingImageSignedUrl = await signedUrl(
          pendingImageBucketName,
          pendingImageFileName,
        );
        user.profilePictures[index].pendingImage.signedUrl = pendingImageSignedUrl;
      }));
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  return res.status(200).send(user);
};
