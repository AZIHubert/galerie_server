import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const { id } = req.user as User;
  const limit = 20;
  let direction = 'DESC';
  let offset: number;
  let order = 'createdAt';
  const usersWithProfilePicture: Array<any> = [];

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

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    // Get all users exept current one,
    // black listed and not confirmed.
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
          'updatedAt',
          'updatedEmailTokenVersion',
        ],
      },
      limit,
      offset,
      order: [[order, direction]],
      where: {
        confirmed: true,
        id: {
          [Op.not]: id,
        },
      },
    });

    await Promise.all(
      users.map(async (user) => {
        // Check user is not black listed.
        // If true, do not push user
        // into final returned users.
        const userIsBlackListed = await checkBlackList(user);
        if (!userIsBlackListed) {
          // Fetch current profile pictures
          // and their signed url.
          let returnedCurrentProfilePicture = null;
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
                    'id',
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
                    'id',
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
                    'id',
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
            returnedCurrentProfilePicture = {
              ...currentProfilePicture.toJSON(),
              cropedImage: {
                ...currentProfilePicture.cropedImage.toJSON(),
                bucketName: undefined,
                fileName: undefined,
                signedUrl: cropedImageSignedUrl,
              },
              originalImage: {
                ...currentProfilePicture.originalImage.toJSON(),
                bucketName: undefined,
                fileName: undefined,
                signedUrl: originalImageSignedUrl,
              },
              pendingImage: {
                ...currentProfilePicture.pendingImage.toJSON(),
                bucketName: undefined,
                fileName: undefined,
                signedUrl: pendingImageSignedUrl,
              },
            };
          }
          const userWithProfilePicture: any = {
            ...user.toJSON(),
            createdAt: undefined,
            currentProfilePicture: returnedCurrentProfilePicture,
          };
          delete userWithProfilePicture.blackList;
          usersWithProfilePicture.push(userWithProfilePicture);
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    action: 'GET',
    data: {
      users: usersWithProfilePicture,
    },
  });
};
