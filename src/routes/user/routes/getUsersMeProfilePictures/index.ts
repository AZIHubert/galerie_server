import { Request, Response } from 'express';

import { Image, ProfilePicture, User } from '@src/db/models';
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
  const { id } = req.user as User;
  let profilePictures: ProfilePicture[];
  try {
    profilePictures = await ProfilePicture.findAll({
      where: { userId: id },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: {
        exclude: [
          'cropedImageId',
          'deletedAt',
          'originalImageId',
          'pendingImageId',
          'updatedAt',
          'userId',
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
    });
    await Promise.all(profilePictures.map(async (profilePicture, index) => {
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
      } = profilePicture;
      const cropedImageSignedUrl = await signedUrl(
        cropedImageBucketName,
        cropedImageFileName,
      );
      profilePictures[index].cropedImage.signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      profilePictures[index].originalImage.signedUrl = originalImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      profilePictures[index].pendingImage.signedUrl = pendingImageSignedUrl;
    }));
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(profilePictures);
};
