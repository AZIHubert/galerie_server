import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import signedUrl from '@src/helpers/signedUrl';
import {
  frameExcluder,
  galeriePictureExcluder,
  imageExcluder,
  userExcluder,
} from '@src/helpers/excluders';

// TODO:
// Need protection:
//  If this frame doesn't have GaleriePictures
//    => destroy it and send a 404 error.
//  If this galerie picture doesn't have croped/pending/original image
//    => destroy it and send a 404 error.
//  If this galerie picture is destroy and frame.galeriePictures.length === 1
//    => destroy frame and send a 404 error.

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  const {
    frameId,
    galerieId,
  } = req.params;
  let frame: Frame | null;
  let galerie: Galerie | null;
  let returnedFrame;

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
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
