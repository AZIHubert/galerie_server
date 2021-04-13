import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.user as User;
  const limit = 20;
  let offset: number;
  const { page } = req.query;
  let profilePictures: ProfilePicture[];

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    profilePictures = await ProfilePicture.findAll({
      attributes: {
        exclude: [
          'createdAt',
          'cropedImageId',
          'originalImageId',
          'pendingImageId',
          'updatedAt',
          'userId',
        ],
      },
      include: [
        {
          as: 'cropedImage',
          attributes: {
            exclude: [
              'createdAt',
              'updatedAt',
            ],
          },
          model: Image,
        },
        {
          as: 'originalImage',
          attributes: {
            exclude: [
              'createdAt',
              'updatedAt',
            ],
          },
          model: Image,
        },
        {
          as: 'pendingImage',
          attributes: {
            exclude: [
              'createdAt',
              'updatedAt',
            ],
          },
          model: Image,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        userId: id,
      },
    });
    await Promise.all(
      profilePictures.map(async (profilePicture, index) => {
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
        const originalImageSignedUrl = await signedUrl(
          originalImageBucketName,
          originalImageFileName,
        );
        const pendingImageSignedUrl = await signedUrl(
          pendingImageBucketName,
          pendingImageFileName,
        );
        profilePictures[index]
          .cropedImage
          .signedUrl = cropedImageSignedUrl;
        profilePictures[index]
          .originalImage
          .signedUrl = originalImageSignedUrl;
        profilePictures[index]
          .pendingImage
          .signedUrl = pendingImageSignedUrl;
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(profilePictures);
};
