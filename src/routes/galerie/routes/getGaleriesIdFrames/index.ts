import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { page } = req.query;
  let offset: number;
  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }
  const { id: userId } = req.user as User;
  const { id: galerieId } = req.params;
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
  let frames: Frame[];
  try {
    frames = await Frame.findAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: {
        exclude: [
          'userId',
        ],
      },
      where: {
        galerieId,
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
      }],
    });
    await Promise.all(
      frames.map((frame, index) => Promise.all(
        frame
          .galeriePictures
          .map(async (galeriePicture, galeriePicturesIndex) => {
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
            frames[index]
              .galeriePictures[galeriePicturesIndex]
              .cropedImage
              .signedUrl = cropedImageSignedUrl;
            const originalImageSignedUrl = await signedUrl(
              originalImageBucketName,
              originalImageFileName,
            );
            frames[index]
              .galeriePictures[galeriePicturesIndex]
              .originalImage
              .signedUrl = originalImageSignedUrl;
            const pendingImageSignedUrl = await signedUrl(
              pendingImageBucketName,
              pendingImageFileName,
            );
            frames[index]
              .galeriePictures[galeriePicturesIndex]
              .pendingImage
              .signedUrl = pendingImageSignedUrl;
          }),
      )),
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(frames);
};
