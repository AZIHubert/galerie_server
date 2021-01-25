import { Request, Response } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.user as User;
  const user = await User.findByPk(id, {
    attributes: {
      exclude: [
        'authTokenVersion',
        'blackListId',
        'confirmed',
        'confirmTokenVersion',
        'currentProfilePictureId',
        'emailTokenVersion',
        'googleId',
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
            'createdAt',
            'cropedImageId',
            'deletedAt',
            'originalImageId',
            'pendingImageId',
            'updatedAt',
            'userId',
          ],
        },
        include: [
          {
            model: Image,
            as: 'cropedImage',
            attributes: {
              exclude: [
                'createdAt',
                'deletedAt',
                'updatedAt',
              ],
            },
          },
          {
            model: Image,
            as: 'originalImage',
            attributes: {
              exclude: [
                'createdAt',
                'deletedAt',
                'updatedAt',
              ],
            },
          },
          {
            model: Image,
            as: 'pendingImage',
            attributes: {
              exclude: [
                'createdAt',
                'deletedAt',
                'updatedAt',
              ],
            },
          },
        ],
      },
      {
        model: ProfilePicture,
        as: 'profilePictures',
        attributes: {
          exclude: [
            'createdAt',
            'cropedImageId',
            'deletedAt',
            'originalImageId',
            'pendingImageId',
            'updatedAt',
            'userId',
          ],
        },
        include: [
          {
            model: Image,
            as: 'cropedImage',
            attributes: {
              exclude: [
                'createdAt',
                'deletedAt',
                'updatedAt',
              ],
            },
          },
          {
            model: Image,
            as: 'originalImage',
            attributes: {
              exclude: [
                'createdAt',
                'deletedAt',
                'updatedAt',
              ],
            },
          },
          {
            model: Image,
            as: 'pendingImage',
            attributes: {
              exclude: [
                'createdAt',
                'deletedAt',
                'updatedAt',
              ],
            },
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
          cropedImage: {
            bucketName: cropedImageBucketName,
            fileName: cropedImageFileName,
          },
          originalImage: {
            bucketName: originalImageBucketName,
            fileName: originalImageFileName,
          },
          pendingImage: {
            bucketName: pendingImageBucketName,
            fileName: pendingImageFileName,
          },
        },
      } = user;
      const cropedImageSignedUrl = await signedUrl(
        cropedImageBucketName,
        cropedImageFileName,
      );
      user.currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      user.currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
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
          cropedImage: {
            bucketName: cropedImageBucketName,
            fileName: cropedImageFileName,
          },
          originalImage: {
            bucketName: originalImageBucketName,
            fileName: originalImageFileName,
          },
          pendingImage: {
            bucketName: pendingImageBucketName,
            fileName: pendingImageFileName,
          },
        } = profilePicture;
        const cropedImageSignedUrl = await signedUrl(
          cropedImageBucketName,
          cropedImageFileName,
        );
        user.profilePictures[index].cropedImage.signedUrl = cropedImageSignedUrl;
        const originalImageSignedUrl = await signedUrl(
          originalImageBucketName,
          originalImageFileName,
        );
        user.profilePictures[index].originalImage.signedUrl = originalImageSignedUrl;
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
