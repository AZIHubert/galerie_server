import { Request, Response } from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user as User;
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
        blackListId: null,
      },
      attributes: {
        exclude: [
          'authTokenVersion',
          'blackListId',
          'confirmed',
          'confirmTokenVersion',
          'currentProfilePictureId',
          'email',
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
      ],
    });
  } catch (err) {
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
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(user);
};
