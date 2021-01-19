import { Request, Response } from 'express';
import { Op } from 'sequelize';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  let users: User[];

  const { userName } = req.params;
  const { user: { id } } = res.locals;
  try {
    users = await User.findAll({
      where: {
        id: {
          [Op.not]: id,
        },
        confirmed: true,
        userName: {
          [Op.iLike]: `%${userName.toLowerCase()}%`,
        },
      },
      attributes: {
        exclude: [
          'password',
          'confirmed',
          'authTokenVersion',
          'confirmTokenVersion',
          'emailTokenVersion',
          'updatedEmailTokenVersion',
          'resetPasswordTokenVersion',
          'currentProfilePictureId',
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
    await Promise.all(users.map(async (user, index) => {
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
    }));
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(users);
};
