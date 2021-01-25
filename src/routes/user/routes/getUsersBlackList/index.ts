import { Request, Response } from 'express';
import { Op } from 'sequelize';

import BlackList from '@src/db/models/blackList';
import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.user as User;
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
          'authTokenVersion',
          'blackListId',
          'confirmed',
          'confirmTokenVersion',
          'currentProfilePictureId',
          'emailTokenVersion',
          'googleId',
          'password',
          'resetPasswordTokenVersion',
          'role',
          'updatedEmailTokenVersion',
        ],
      },
      include: [
        {
          model: BlackList,
          as: 'blackList',
          attributes: {
            exclude: [
              'adminId',
              'userId',
            ],
          },
          include: [
            {
              model: User,
              as: 'admin',
              attributes: {
                exclude: [
                  'authTokenVersion',
                  'blackListId',
                  'confirmed',
                  'confirmTokenVersion',
                  'createdAt',
                  'currentProfilePictureId',
                  'deletedAt',
                  'email',
                  'emailTokenVersion',
                  'googleId',
                  'password',
                  'resetPasswordTokenVersion',
                  'updatedAt',
                  'updatedEmailTokenVersion',
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
              'createdAt',
              'cropedImageId',
              'deletedAt',
              'pendingImageId',
              'originalImageId',
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
