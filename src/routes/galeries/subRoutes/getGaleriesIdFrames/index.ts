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
//  If a frame doesn't have GaleriePictures
//    => destroy it.
//  If a galerie picture doesn't have croped/pending/original image
//    => destroy it.
//  If a galerie picture is destroy and frame.galeriePictures.length === 1
//    => destroy frame.

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
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
        }, {
          as: 'user',
          attributes: {
            exclude: userExcluder,
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

        // Compose the final frame and push it
        // to returnedFrames.
        const returnedFrame = {
          ...frame.toJSON(),
          galeriePictures: returnedGaleriePictures,
          user: userIsBlackListed ? null : {
            ...frame.user.toJSON(),
            currentProfilePicture,
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
