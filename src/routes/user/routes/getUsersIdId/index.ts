import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  let currentProfilePicture: ProfilePicture | null;
  const { id } = req.params;
  const { id: userId } = req.user as User;
  let user: User | null;

  // Don't allow to fetch current user.
  // To do that, use GET /users/me instead.
  if (id === userId) {
    return res.status(400).send({
      errors: 'params.id cannot be the same as your current one',
    });
  }

  // Fetch confirmed/non blacklisted user with id.
  try {
    user = await User.findOne({
      attributes: {
        exclude: [
          'authTokenVersion',
          'confirmed',
          'confirmTokenVersion',
          'emailTokenVersion',
          'email',
          'facebookId',
          'googleId',
          'password',
          'resetPasswordTokenVersion',
          'updatedEmailTokenVersion',
        ],
      },
      include: [
        {
          as: 'blackList',
          model: BlackList,
        },
      ],
      where: {
        $blackList$: null,
        confirmed: true,
        id,
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

  // Fetch current profile picture
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
  const userWithProfilePicture: any = {
    ...user.toJSON(),
    currentProfilePicture: currentProfilePicture
      ? currentProfilePicture.toJSON()
      : undefined,
  };
  delete userWithProfilePicture.blackList;
  return res.status(200).send(userWithProfilePicture);
};
