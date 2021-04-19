import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  let currentProfilePicture: ProfilePicture | null;
  const { id } = req.user as User;
  let user: User | null;

  // fetch current user
  try {
    user = await User.findByPk(id, {
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
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }

  // fetch current profile picture
  try {
    currentProfilePicture = await ProfilePicture.findOne({
      attributes: {
        exclude: [
          'createdAt',
          'cropedImageId',
          'current',
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
        current: true,
        userId: user.id,
      },
    });
    if (currentProfilePicture) {
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
      } = currentProfilePicture;
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
      currentProfilePicture
        .cropedImage
        .signedUrl = cropedImageSignedUrl;
      currentProfilePicture
        .originalImage
        .signedUrl = originalImageSignedUrl;
      currentProfilePicture
        .pendingImage
        .signedUrl = pendingImageSignedUrl;
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // Compose final returned user.
  const userWithProfilePicture = {
    ...user.toJSON(),
    currentProfilePicture: currentProfilePicture
      ? currentProfilePicture.toJSON()
      : undefined,
  };
  return res.status(200).send({
    action: 'GET',
    data: {
      user: userWithProfilePicture,
    },
  });
};
