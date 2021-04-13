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
  const { id } = req.params;
  let profilePicture: ProfilePicture | null;
  const { id: userId } = req.user as User;

  // Fetch profile picture
  try {
    profilePicture = await ProfilePicture.findOne({
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
      where: {
        id,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }

  // fetch signed urls
  try {
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
    profilePicture
      .cropedImage
      .signedUrl = cropedImageSignedUrl;
    profilePicture
      .originalImage
      .signedUrl = originalImageSignedUrl;
    profilePicture
      .pendingImage
      .signedUrl = pendingImageSignedUrl;
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    profilePicture,
  });
};
