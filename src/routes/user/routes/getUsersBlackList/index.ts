import { Request, Response } from 'express';
import { Op } from 'sequelize';

import {
  BlackList,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  let direction = 'DESC';
  const { id } = req.user as User;
  const limit = 20;
  let offset: number;
  let order = 'createdAt';
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const usersWithProfilePicture: Array<any> = [];

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  if (
    queryOrder === 'createdAt'
    || queryOrder === 'pseudonym'
    || queryOrder === 'userName'
  ) {
    order = queryOrder;
  }

  try {
    // Get all black listed user
    const users = await User.findAll({
      attributes: {
        exclude: [
          'authTokenVersion',
          'confirmed',
          'confirmTokenVersion',
          'email',
          'emailTokenVersion',
          'facebookId',
          'googleId',
          'password',
          'resetPasswordTokenVersion',
        ],
      },
      include: [
        {
          as: 'blackList',
          attributes: {
            exclude: [
              'adminId',
              'userId',
            ],
          },
          include: [
            {
              as: 'admin',
              attributes: {
                exclude: [
                  'authTokenVersion',
                  'confirmed',
                  'confirmTokenVersion',
                  'email',
                  'emailTokenVersion',
                  'facebookId',
                  'googleId',
                  'password',
                  'resetPasswordTokenVersion',
                  'updatedEmailTokenVersion',
                ],
              },
              model: User,
            },
          ],
          model: BlackList,
        },
      ],
      limit,
      offset,
      order: [[order, direction]],
      where: {
        '$blackList.id$': {
          [Op.not]: null,
        },
        confirmed: true,
        id: {
          [Op.not]: id,
        },
      },

    });

    await Promise.all(
      users.map(async (user) => {
        // get black listed user's current profile picture
        const currentProfilePicture = await ProfilePicture.findOne({
          attributes: {
            exclude: [
              'createdAt',
              'cropedImageId',
              'current',
              'originalImageId',
              'pendingImageId',
              'updatedAt',
              'userId',
            ],
          },
          include: [
            {
              as: 'cropedImage',
              attributes: {
                exclude: [
                  'createdAt',
                  'updatedAt',
                ],
              },
              model: Image,
            },
            {
              as: 'originalImage',
              attributes: {
                exclude: [
                  'createdAt',
                  'updatedAt',
                ],
              },
              model: Image,
            },
            {
              as: 'pendingImage',
              attributes: {
                exclude: [
                  'createdAt',
                  'updatedAt',
                ],
              },
              model: Image,
            },
          ],
          where: {
            current: true,
            userId: user.id,
          },
        });
        if (currentProfilePicture) {
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
          } = currentProfilePicture;
          const cropedImageSignedUrl = await signedUrl(
            cropedImageBucketName,
            cropedImageFileName,
          );
          const originalImageSignedUrl = await signedUrl(
            originalImageBucketName,
            originalImageFileName,
          );
          const pendingImageSignedUrl = await signedUrl(
            pendingImageBucketName,
            pendingImageFileName,
          );
          currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
          currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
          currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
        }

        // Get admin's current profile picture
        let adminCurrentProfilePicture: ProfilePicture | null = null;
        if (user.blackList.admin) {
          adminCurrentProfilePicture = await ProfilePicture.findOne({
            attributes: {
              exclude: [
                'createdAt',
                'cropedImageId',
                'current',
                'originalImageId',
                'pendingImageId',
                'updatedAt',
                'userId',
              ],
            },
            include: [
              {
                as: 'cropedImage',
                attributes: {
                  exclude: [
                    'createdAt',
                    'updatedAt',
                  ],
                },
                model: Image,
              },
              {
                as: 'originalImage',
                attributes: {
                  exclude: [
                    'createdAt',
                    'updatedAt',
                  ],
                },
                model: Image,
              },
              {
                as: 'pendingImage',
                attributes: {
                  exclude: [
                    'createdAt',
                    'updatedAt',
                  ],
                },
                model: Image,
              },
            ],
            where: {
              current: true,
              userId: user.blackList.admin.id,
            },
          });
          if (adminCurrentProfilePicture) {
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
            } = adminCurrentProfilePicture;
            const cropedImageSignedUrl = await signedUrl(
              cropedImageBucketName,
              cropedImageFileName,
            );
            const originalImageSignedUrl = await signedUrl(
              originalImageBucketName,
              originalImageFileName,
            );
            const pendingImageSignedUrl = await signedUrl(
              pendingImageBucketName,
              pendingImageFileName,
            );
            adminCurrentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
            adminCurrentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
            adminCurrentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
          }
        }
        const userWithProfilePicture: any = {
          ...user.toJSON(),
          currentProfilePicture: currentProfilePicture
            ? currentProfilePicture.toJSON()
            : undefined,
          blackList: {
            ...user.blackList.toJSON(),
            admin: {
              ...user.blackList.admin.toJSON(),
              currentProfilePicture: adminCurrentProfilePicture
                ? adminCurrentProfilePicture.toJSON()
                : undefined,
            },
          },
        };
        usersWithProfilePicture.push(userWithProfilePicture);
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.send(usersWithProfilePicture);
};
