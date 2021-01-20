import { Request, Response } from 'express';
import { Op } from 'sequelize';

import BlackList from '@src/db/models/blackList';
import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import signedUrl from '@src/helpers/signedUrl';

export default async (_req: Request, res: Response) => {
  const { user: { id } } = res.locals;
  let users: User[];
  try {
    users = await User.findAll({
      where: {
        id: {
          [Op.not]: id,
        },
        blackListId: {
          [Op.not]: null,
        },
      },
      attributes: {
        exclude: [
          'role',
          'blackListId',
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
          model: BlackList,
          as: 'blackList',
          attributes: {
            exclude: [
              'userId',
            ],
          },
          include: [
            {
              model: User,
              as: 'admin',
              attributes: {
                exclude: [
                  'email',
                  'password',
                  'confirmed',
                  'authTokenVersion',
                  'confirmTokenVersion',
                  'emailTokenVersion',
                  'updatedEmailTokenVersion',
                  'resetPasswordTokenVersion',
                  'currentProfilePictureId',
                  'blackListId',
                ],
              },
            },
          ],
        },
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
              'deletedAt',
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
    await Promise.all(
      users.map(async (user, index) => {
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
          users[index].currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
          const cropedImageSignedUrl = await signedUrl(
            cropedImageBucketName,
            cropedImageFileName,
          );
          users[index].currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
          const pendingImageSignedUrl = await signedUrl(
            pendingImageBucketName,
            pendingImageFileName,
          );
          users[index].currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.send(users);
};
