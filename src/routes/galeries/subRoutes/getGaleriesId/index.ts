// GET /galeries/:galerieId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  galeriePictureExcluder,
  imageExcluder,
} from '@src/helpers/excluders';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let returnCurrentCoverPicture = null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

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
          id: currentUser.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
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
          cropedImage,
          originalImage,
          pendingImage,
        }],
      } = currentCoverPicture;

      // Check if all image from galeriePicture
      // exist, if one if it doesn\'t exist,
      // destroy the galeriePicture,
      // all existing image and the image
      // from Google Bucket.
      if (
        cropedImage
        && originalImage
        && pendingImage
      ) {
        const cropedImageSignedUrl = await signedUrl(
          cropedImage.bucketName,
          cropedImage.fileName,
        );
        const originalImageSignedUrl = await signedUrl(
          originalImage.bucketName,
          originalImage.fileName,
        );
        const pendingImageSignedUrl = await signedUrl(
          pendingImage.bucketName,
          pendingImage.fileName,
        );

        // Check if all image from Google Bucket exists.
        // If one of theme doesn\'t exist,
        // destroy all images from Google Bucket,
        // all images and all GalerieImages.
        if (
          cropedImageSignedUrl.OK
          && originalImageSignedUrl.OK
          && pendingImageSignedUrl.OK
        ) {
          returnCurrentCoverPicture = {
            ...currentCoverPicture.galeriePictures[0].toJSON(),
            cropedImage: {
              ...currentCoverPicture.galeriePictures[0].cropedImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: cropedImageSignedUrl.signedUrl,
            },
            originalImage: {
              ...currentCoverPicture.galeriePictures[0].originalImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: originalImageSignedUrl.signedUrl,
            },
            pendingImage: {
              ...currentCoverPicture.galeriePictures[0].pendingImage.toJSON(),
              bucketName: undefined,
              fileName: undefined,
              signedUrl: pendingImageSignedUrl.signedUrl,
            },
          };
        } else {
          if (cropedImageSignedUrl.OK) {
            await gc
              .bucket(cropedImage.bucketName)
              .file(cropedImage.fileName)
              .delete();
          }
          if (originalImageSignedUrl.OK) {
            await gc
              .bucket(originalImage.bucketName)
              .file(originalImage.fileName)
              .delete();
          }
          if (pendingImageSignedUrl.OK) {
            await gc
              .bucket(pendingImage.bucketName)
              .file(pendingImage.fileName)
              .delete();
          }
          await cropedImage.destroy();
          await originalImage.destroy();
          await pendingImage.destroy();
          await currentCoverPicture.galeriePictures[0].destroy();
        }
      } else {
        if (cropedImage) {
          await cropedImage.destroy();
          await gc
            .bucket(cropedImage.bucketName)
            .file(cropedImage.fileName)
            .delete();
        }
        if (originalImage) {
          await originalImage.destroy();
          await gc
            .bucket(originalImage.bucketName)
            .file(originalImage.fileName)
            .delete();
        }
        if (pendingImage) {
          await pendingImage.destroy();
          await gc
            .bucket(pendingImage.bucketName)
            .file(pendingImage.fileName)
            .delete();
        }
        await currentCoverPicture.galeriePictures[0].destroy();
      }
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);

  // Set GalerieUser.hasNewFrame to false.
  const hasNewFrame = userFromGalerie
    ? userFromGalerie.GalerieUser.hasNewFrames
    : false;
  if (hasNewFrame) {
    try {
      await GalerieUser.update({
        hasNewFrames: false,
      }, {
        where: {
          userId: currentUser.id,
          galerieId,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerie: {
        ...galerie.toJSON(),
        currentCoverPicture: returnCurrentCoverPicture,
        role: userFromGalerie
          ? userFromGalerie.GalerieUser.role
          : 'user',
        users: [],
      },
    },
  });
};
