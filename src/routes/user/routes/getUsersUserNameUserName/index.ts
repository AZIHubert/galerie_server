import { Request, Response } from 'express';
import { Op } from 'sequelize';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  let users: User[];
  const { userName } = req.params;
  const { id } = req.user as User;
  try {
    users = await User.findAll({
      where: {
        id: {
          [Op.not]: id,
        },
        confirmed: true,
        blackListId: null,
        userName: {
          [Op.iLike]: `%${userName.toLowerCase()}%`,
        },
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
    await Promise.all(users.map(async (user, index) => {
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
        users[index].currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
        const originalImageSignedUrl = await signedUrl(
          originalImageBucketName,
          originalImageFileName,
        );
        users[index].currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
        const pendingImageSignedUrl = await signedUrl(
          pendingImageBucketName,
          pendingImageFileName,
        );
        users[index].currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
      }
    }));
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(users);
};
