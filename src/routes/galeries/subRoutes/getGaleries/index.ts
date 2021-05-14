import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  let galeries: Galerie[];
  const galerieWithUsers: Array<any> = [];
  const { id } = req.user as User;
  const limit = 20;
  const { page } = req.query;
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    galeries = await Galerie.findAll({
      attributes: {
        exclude: [
          'updatedAt',
        ],
      },
      include: [{
        model: User,
        where: {
          id,
        },
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    await Promise.all(
      galeries.map(async (galerie) => {
        let returnCurrentCoverPicture = null;

        // Return currentCoverPicture if exist.
        const currentCoverPicture = await Frame.findOne({
          include: [{
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
            model: GaleriePicture,
            where: {
              coverPicture: true,
            },
          }],
          where: {
            galerieId: galerie.id,
          },
        });

        // Fetch signed url if galerie have cover picture.
        if (currentCoverPicture && currentCoverPicture.galeriePictures.length) {
          const {
            galeriePictures: [{
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
            }],
          } = currentCoverPicture;
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

          // TODO: not finish.
          returnCurrentCoverPicture = {
            ...currentCoverPicture.galeriePictures[0].toJSON(),
            cropedImage: {
              ...currentCoverPicture.galeriePictures[0].cropedImage.toJSON(),
              bucketName: undefined,
              createdAt: undefined,
              fileName: undefined,
              id: undefined,
              signedUrl: cropedImageSignedUrl,
              updatedAt: undefined,
            },
            cropedImageId: undefined,
            originalImage: {
              ...currentCoverPicture.galeriePictures[0].originalImage.toJSON(),
              bucketName: undefined,
              createdAt: undefined,
              fileName: undefined,
              id: undefined,
              signedUrl: originalImageSignedUrl,
              updatedAt: undefined,
            },
            originalImageId: undefined,
            pendingImage: {
              ...currentCoverPicture.galeriePictures[0].pendingImage.toJSON(),
              bucketName: undefined,
              createdAt: undefined,
              fileName: undefined,
              id: undefined,
              signedUrl: pendingImageSignedUrl,
              updatedAt: undefined,
            },
          };
        }

        galerieWithUsers.push({
          ...galerie.toJSON(),
          currentCoverPicture: returnCurrentCoverPicture,
          role: galerie
            .users
            .filter((user) => user.id === id)[0]
            .GalerieUser.role,
          users: [],
        });
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galeries: galerieWithUsers,
    },
  });
};
