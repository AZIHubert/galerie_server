import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import { INVALID_UUID } from '@src/helpers/errorMessages';
import {
  frameExcluder,
  galeriePictureExcluder,
  imageExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  let frame: Frame | null;
  let galerie: Galerie | null;
  let returnedFrame;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
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
      errors: 'galerie not found',
    });
  }

  // Fectch frame.
  try {
    frame = await Frame.findOne({
      attributes: {
        exclude: frameExcluder,
      },
      include: [
        {
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
              model: Image,
              as: 'originalImage',
              attributes: {
                exclude: imageExcluder,
              },
            },
            {
              model: Image,
              as: 'pendingImage',
              attributes: {
                exclude: imageExcluder,
              },
            },
          ],
          model: GaleriePicture,
        }, {
          model: User,
          as: 'user',
          attributes: {
            exclude: userExcluder,
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

  // Check if frame exist.
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }

  try {
    const returnedGaleriePictures: Array<any> = [];
    let currentProfilePicture;

    // Fetch signed url for each
    // galerie pictures images.
    await Promise.all(
      frame
        .galeriePictures
        .map(async (galeriePicture) => {
          const {
            cropedImage,
            originalImage,
            pendingImage,
          } = galeriePicture;

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
              await galeriePicture.destroy();
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
            await galeriePicture.destroy();
          }
        }),
    );

    // Check if frame have at least
    // one galeriePicture.
    if (returnedGaleriePictures.length) {
      // check if user is not blacklisted.
      const userIsBlackListed = await checkBlackList(frame.user);

      // Fetch current profile picture
      // only if user is not black listed.
      if (!userIsBlackListed) {
        // Find the current profile picture
        // of the current user.
        currentProfilePicture = await fetchCurrentProfilePicture(frame.user);
      }

      returnedFrame = {
        ...frame.toJSON(),
        galeriePictures: returnedGaleriePictures,
        user: userIsBlackListed ? null : {
          ...frame.user.toJSON(),
          currentProfilePicture,
        },
      };
    } else {
      await frame.destroy();
      return res.status(404).send({
        errors: 'frame not found',
      });
    }
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
