import { Request, Response } from 'express';

import {
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId } = req.params;
  let galerie: Galerie | null;
  try {
    galerie = await Galerie.findByPk(galerieId, {
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
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }
  let role: string;
  try {
    const galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId,
      },
    });
    if (galerieUser) {
      role = galerieUser.role;
    } else {
      role = 'user';
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  if (galerie.coverPicture) {
    try {
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
      galerie.coverPicture.cropedImage.signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      galerie.coverPicture.originalImage.signedUrl = originalImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      galerie.coverPicture.pendingImage.signedUrl = pendingImageSignedUrl;
      await Promise
        .all(galerie.users.map(async (user, userIndex) => {
          if (galerie && user.currentProfilePicture) {
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
            galerie
              .users[userIndex]
              .currentProfilePicture
              .cropedImage
              .signedUrl = userCropedImageSignedUrl;
            const userOriginalImageSignedUrl = await signedUrl(
              userOriginalImageBucketName,
              userOriginalImageFileName,
            );
            galerie
              .users[userIndex]
              .currentProfilePicture
              .originalImage
              .signedUrl = userOriginalImageSignedUrl;
            const userPendingImageSignedUrl = await signedUrl(
              userPendingImageBucketName,
              userPendingImageFileName,
            );
            galerie
              .users[userIndex]
              .currentProfilePicture
              .pendingImage
              .signedUrl = userPendingImageSignedUrl;
          }
        }));
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  return res.status(200).send({
    galerie: {
      ...galerie.toJSON(),
      role,
    },
    type: 'GET',
  });
};
