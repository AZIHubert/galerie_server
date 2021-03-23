import { Request, Response } from 'express';

import {
  Galerie,
  GaleriePicture,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { page } = req.query;
  let offset: number;
  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }
  const { id: userId } = req.user as User;
  let galeries: Galerie[];
  try {
    galeries = await Galerie.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: User,
        where: {
          id: userId,
        },
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
      }, {
        model: GaleriePicture,
        attributes: {
          exclude: [
            'cropedImageId',
            'id',
            'index',
            'originalImageId',
            'pendingImageId',
            'frameId',
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
      }],
    });
    await Promise.all(galeries.map(async (galerie, index) => {
      if (galerie.coverPicture) {
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
        } = galerie.coverPicture;
        const cropedImageSignedUrl = await signedUrl(
          cropedImageBucketName,
          cropedImageFileName,
        );
        galeries[index].coverPicture.cropedImage.signedUrl = cropedImageSignedUrl;
        const originalImageSignedUrl = await signedUrl(
          originalImageBucketName,
          originalImageFileName,
        );
        galeries[index].coverPicture.originalImage.signedUrl = originalImageSignedUrl;
        const pendingImageSignedUrl = await signedUrl(
          pendingImageBucketName,
          pendingImageFileName,
        );
        galeries[index].coverPicture.pendingImage.signedUrl = pendingImageSignedUrl;
        await Promise
          .all(galerie.users.map(async (user, userIndex) => {
            if (user.currentProfilePicture) {
              const {
                currentProfilePicture: {
                  cropedImage: {
                    bucketName: userCropedImageBucketName,
                    fileName: userCropedImageFileName,
                  },
                  originalImage: {
                    bucketName: userOriginalImageBucketName,
                    fileName: userOriginalImageFileName,
                  },
                  pendingImage: {
                    bucketName: userPendingImageBucketName,
                    fileName: userPendingImageFileName,
                  },
                },
              } = user;
              const userCropedImageSignedUrl = await signedUrl(
                userCropedImageBucketName,
                userCropedImageFileName,
              );
              galeries[index]
                .users[userIndex]
                .currentProfilePicture
                .cropedImage
                .signedUrl = userCropedImageSignedUrl;
              const userOriginalImageSignedUrl = await signedUrl(
                userOriginalImageBucketName,
                userOriginalImageFileName,
              );
              galeries[index]
                .users[userIndex]
                .currentProfilePicture
                .originalImage
                .signedUrl = userOriginalImageSignedUrl;
              const userPendingImageSignedUrl = await signedUrl(
                userPendingImageBucketName,
                userPendingImageFileName,
              );
              galeries[index]
                .users[userIndex]
                .currentProfilePicture
                .pendingImage
                .signedUrl = userPendingImageSignedUrl;
            }
          }));
      }
    }));
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(galeries);
};
