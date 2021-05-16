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
import {
  galeriePictureExcluder,
  imageExcluder,
} from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const user = req.user as User;
  let galerie: Galerie | null;
  let returnCurrentCoverPicture = null;

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      attributes: {
        exclude: [
          'updatedAt',
        ],
      },
      include: [{
        model: User,
        where: {
          id: user.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Return currentCoverPicture if exist.
  try {
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
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerie: {
        ...galerie.toJSON(),
        currentCoverPicture: returnCurrentCoverPicture,
        role: galerie
          .users
          .filter((u) => u.id === user.id)[0]
          .GalerieUser.role,
        users: [],
      },
    },
  });
};
