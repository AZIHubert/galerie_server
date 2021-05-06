import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: galerieId } = req.params;
  const limit = 20;
  const { page } = req.query;
  const { id: userId } = req.user as User;
  const returnedFrames: Array<any> = [];
  let frames: Frame[];
  let galerie: Galerie | null;
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Fecth galerie,
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

  // Fetch all frames relative to this galerie.
  try {
    frames = await Frame.findAll({
      attributes: {
        exclude: [
          'userId',
        ],
      },
      include: [
        {
          attributes: {
            exclude: [
              'createdAt',
              'cropedImageId',
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
          model: GaleriePicture,
        }, {
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
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        galerieId,
      },
    });

    await Promise.all(
      frames.map(async (frame) => {
        let returnedCurrentProfilePicture;
        const returnedGaleriePictures: Array<any> = [];

        await Promise.all(
          frame
            .galeriePictures
            .map(async (galeriePicture) => {
              // Fetch signed url for each
              // galerie pictures images.
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
                  createdAt: undefined,
                  fileName: undefined,
                  id: undefined,
                  signedUrl: cropedImageSignedUrl,
                  updatedAt: undefined,
                },
                originalImage: {
                  ...galeriePicture.originalImage.toJSON(),
                  bucketName: undefined,
                  createdAt: undefined,
                  fileName: undefined,
                  id: undefined,
                  signedUrl: originalImageSignedUrl,
                  updatedAt: undefined,
                },
                pendingImage: {
                  ...galeriePicture.pendingImage.toJSON(),
                  bucketName: undefined,
                  createdAt: undefined,
                  fileName: undefined,
                  id: undefined,
                  signedUrl: pendingImageSignedUrl,
                  updatedAt: undefined,
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

        // Compose the final frame and push it
        // to returnedFrames.
        const returnedFrame = {
          ...frame.toJSON(),
          galerieId: undefined,
          galeriePictures: returnedGaleriePictures,
          updatedAt: undefined,
          user: {
            ...frame.user.toJSON(),
            currentProfilePicture: returnedCurrentProfilePicture,
          },
        };
        returnedFrames.push(returnedFrame);
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      frames: returnedFrames,
    },
  });
};
