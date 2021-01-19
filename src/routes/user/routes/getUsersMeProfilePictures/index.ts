import { Request, Response } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import signedUrl from '@src/helpers/signedUrl';

export default async (_req: Request, res: Response) => {
  const { user: { id } } = res.locals;
  let profilePictures: ProfilePicture[];
  try {
    profilePictures = await ProfilePicture.findAll({
      where: { userId: id },
      attributes: {
        exclude: [
          'originalImageId',
          'cropedImageId',
          'pendingImageId',
          'createdAt',
          'updatedAt',
        ],
      },
      include: [
        {
          model: Image,
          as: 'originalImage',
        },
        {
          model: Image,
          as: 'cropedImage',
        },
        {
          model: Image,
          as: 'pendingImage',
        },
      ],
    });
    await Promise.all(profilePictures.map(async (profilePicture, index) => {
      const {
        originalImage: {
          bucketName: originalImageBucketName,
          fileName: originalImageFileName,
        },
        cropedImage: {
          bucketName: cropedImageBucketName,
          fileName: cropedImageFileName,
        },
        pendingImage: {
          bucketName: pendingImageBucketName,
          fileName: pendingImageFileName,
        },
      } = profilePicture;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      profilePictures[index].originalImage.signedUrl = originalImageSignedUrl;
      const cropedImageSignedUrl = await signedUrl(
        cropedImageBucketName,
        cropedImageFileName,
      );
      profilePictures[index].cropedImage.signedUrl = cropedImageSignedUrl;
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
