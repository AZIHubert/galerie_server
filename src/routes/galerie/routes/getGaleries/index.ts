import { Request, Response } from 'express';

import {
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  let galeries: Galerie[];
  try {
    galeries = await Galerie.findAll({
      include: [{
        model: User,
        where: {
          id: userId,
        },
        attributes: {
          exclude: [
            'authTokenVersion',
            'confirmed',
            'confirmTokenVersion',
            'email',
            'emailTokenVersion',
            'facebookId',
            'googleId',
            'password',
            'resetPasswordTokenVersion',
            'updatedEmailTokenVersion',
          ],
        },
      }, {
        model: GaleriePicture,
        attributes: {
          exclude: [
            'cropedImageId',
            'id',
            'index',
            'originalImageId',
            'pendingImageId',
            'frameId',
          ],
        },
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
    let error: any;
    try {
      await Promise.all(galeries.map(async (galerie, index) => {
        if (galerie.coverPicture) {
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
          } = galerie.coverPicture;
          const cropedImageSignedUrl = await signedUrl(
            cropedImageBucketName,
            cropedImageFileName,
          );
          galeries[index].coverPicture.cropedImage.signedUrl = cropedImageSignedUrl;
          const originalImageSignedUrl = await signedUrl(
            originalImageBucketName,
            originalImageFileName,
          );
          galeries[index].coverPicture.originalImage.signedUrl = originalImageSignedUrl;
          const pendingImageSignedUrl = await signedUrl(
            pendingImageBucketName,
            pendingImageFileName,
          );
          galeries[index].coverPicture.pendingImage.signedUrl = pendingImageSignedUrl;
        }
      }));
    } catch (err) {
      return res.status(500).send(err);
    }
    if (error) {
      return res.status(500).send(error);
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(galeries);
};
