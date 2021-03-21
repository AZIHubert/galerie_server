import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  ProfilePicture,
  Image,
  User,
} from '@src/db/models';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, frameId } = req.params;
  let galerie: Galerie | null;
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: userId,
        },
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
  let frame: Frame | null;
  try {
    frame = await Frame.findOne({
      where: {
        galerieId,
        id: frameId,
      },
      include: [{
        model: GaleriePicture,
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
      }, {
        model: User,
        as: 'user',
        attributes: {
          exclude: [
            'authTokenVersion',
            'blackListId',
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
        model: User,
        as: 'likes',
        attributes: {
          exclude: [
            'authTokenVersion',
            'blackListId',
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
      }],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }
  try {
    await Promise.all(
      frame.likes.map(async (like, index) => {
        if (frame && like.currentProfilePicture) {
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
          } = like;
          const cropedImageSignedUrl = await signedUrl(
            cropedImageBucketName,
            cropedImageFileName,
          );
          frame
            .likes[index]
            .currentProfilePicture
            .cropedImage
            .signedUrl = cropedImageSignedUrl;
          const originalImageSignedUrl = await signedUrl(
            originalImageBucketName,
            originalImageFileName,
          );
          frame
            .likes[index]
            .currentProfilePicture
            .originalImage
            .signedUrl = originalImageSignedUrl;
          const pendingImageSignedUrl = await signedUrl(
            pendingImageBucketName,
            pendingImageFileName,
          );
          frame
            .likes[index]
            .currentProfilePicture
            .pendingImage
            .signedUrl = pendingImageSignedUrl;
        }
      }),
    );
    await Promise.all(
      frame
        .galeriePictures
        .map(async (galeriePicture, index) => {
          if (frame) {
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
            } = galeriePicture;
            const cropedImageSignedUrl = await signedUrl(
              cropedImageBucketName,
              cropedImageFileName,
            );
            frame
              .galeriePictures[index]
              .cropedImage
              .signedUrl = cropedImageSignedUrl;
            const originalImageSignedUrl = await signedUrl(
              originalImageBucketName,
              originalImageFileName,
            );
            frame
              .galeriePictures[index]
              .originalImage
              .signedUrl = originalImageSignedUrl;
            const pendingImageSignedUrl = await signedUrl(
              pendingImageBucketName,
              pendingImageFileName,
            );
            frame
              .galeriePictures[index]
              .pendingImage
              .signedUrl = pendingImageSignedUrl;
          }
        }),
    );
    if (frame.user.currentProfilePictureId) {
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
      } = frame.user;
      const cropedImageSignedUrl = await signedUrl(
        cropedImageBucketName,
        cropedImageFileName,
      );
      frame.user.currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      frame.user.currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      frame.user.currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
  return res.status(200).send(frame);
};
