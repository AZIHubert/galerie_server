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
  let frame: Frame | null;
  let galerie: Galerie | null;
  let returnedFrame;

  // Fetch galerie.
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

  // Fectch frame.
  try {
    frame = await Frame.findOne({
      attributes: {
        exclude: [
          'galerieId',
          'updatedAt',
          'userId',
        ],
      },
      include: [
        {
          attributes: {
            exclude: [
              'cropedImageId',
              'createdAt',
              'frameId',
              'originalImageId',
              'pendingImageId',
              'updatedAt',
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
              model: Image,
              as: 'originalImage',
              attributes: {
                exclude: [
                  'createdAt',
                  'id',
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
                  'id',
                  'updatedAt',
                ],
              },
            },
          ],
          model: GaleriePicture,
        }, {
          model: User,
          as: 'user',
          attributes: {
            exclude: [
              'authTokenVersion',
              'confirmed',
              'confirmTokenVersion',
              'emailTokenVersion',
              'email',
              'facebookId',
              'googleId',
              'password',
              'resetPasswordTokenVersion',
              'updatedAt',
              'updatedEmailTokenVersion',
            ],
          },
        },
      ],
      where: {
        galerieId,
        id: frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }

  try {
    const returnedGaleriePictures: Array<any> = [];
    let returnedCurrentProfilePicture;

    // Fetch signed url for each
    // galerie pictures images.
    await Promise.all(
      frame
        .galeriePictures
        .map(async (galeriePicture) => {
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
          const originalImageSignedUrl = await signedUrl(
            originalImageBucketName,
            originalImageFileName,
          );
          const pendingImageSignedUrl = await signedUrl(
            pendingImageBucketName,
            pendingImageFileName,
          );
          const returnedGaleriePicture = {
            ...galeriePicture.toJSON(),
            cropedImage: {
              ...galeriePicture.cropedImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: cropedImageSignedUrl,
            },
            originalImage: {
              ...galeriePicture.originalImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: originalImageSignedUrl,
            },
            pendingImage: {
              ...galeriePicture.pendingImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: pendingImageSignedUrl,
            },
          };
          returnedGaleriePictures.push(returnedGaleriePicture);
        }),
    );

    // Find the current profile picture
    // of the current user.
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
        userId: frame.user.id,
        current: true,
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
    returnedFrame = {
      ...frame.toJSON(),
      galeriePictures: returnedGaleriePictures,
      user: {
        ...frame.user.toJSON(),
        currentProfilePicture: returnedCurrentProfilePicture,
      },
    };
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    action: 'GET',
    data: {
      frame: returnedFrame,
      galerieId,
    },
  });
};
