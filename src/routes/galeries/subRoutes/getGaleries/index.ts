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

import {
  galerieExcluder,
  galeriePictureExcluder,
  imageExcluder,
} from '@src/helpers/excluders';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const returnedGaleries: Array<any> = [];
  const { id } = req.user as User;
  const limit = 20;
  const { page } = req.query;
  let galeries: Galerie[];
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    galeries = await Galerie.findAll({
      attributes: {
        exclude: galerieExcluder,
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
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    await Promise.all(
      galeries.map(async (galerie) => {
        let returnCurrentCoverPicture = null;

        // Fetch current cover picture.
        const currentCoverPicture = await Frame.findOne({
          include: [{
            attributes: {
              exclude: galeriePictureExcluder,
            },
            include: [
              {
                as: 'cropedImage',
                attributes: {
                  exclude: imageExcluder,
                },
                model: Image,
              },
              {
                as: 'originalImage',
                attributes: {
                  exclude: imageExcluder,
                },
                model: Image,
              },
              {
                as: 'pendingImage',
                attributes: {
                  exclude: imageExcluder,
                },
                model: Image,
              },
            ],
            model: GaleriePicture,
            where: {
              current: true,
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

          returnCurrentCoverPicture = {
            ...currentCoverPicture.galeriePictures[0].toJSON(),
            cropedImage: {
              ...currentCoverPicture.galeriePictures[0].cropedImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: cropedImageSignedUrl,
            },
            originalImage: {
              ...currentCoverPicture.galeriePictures[0].originalImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: originalImageSignedUrl,
            },
            pendingImage: {
              ...currentCoverPicture.galeriePictures[0].pendingImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: pendingImageSignedUrl,
            },
          };
        }

        returnedGaleries.push({
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
      galeries: returnedGaleries,
    },
  });
};
