import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import signedUrl from '@src/helpers/signedUrl';

export default async (req: Request, res: Response) => {
  const { id } = req.user as User;
  let user: User | null;
  let currentProfilePicture: ProfilePicture | null;
  try {
    user = await User.findByPk(id, {
      attributes: {
        exclude: [
          'authTokenVersion',
          'blackListId',
          'confirmed',
          'confirmTokenVersion',
          'emailTokenVersion',
          'googleId',
          'password',
          'profilePictures',
          'resetPasswordTokenVersion',
          'updatedEmailTokenVersion',
        ],
      },
      order: [
        [
          {
            model: ProfilePicture,
            as: 'profilePictures',
          },
          'createdAt',
          'DESC',
        ],
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  try {
    currentProfilePicture = await ProfilePicture.findOne({
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
      where: {
        userId: user.id,
        current: true,
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
      currentProfilePicture.cropedImage.signedUrl = cropedImageSignedUrl;
      const originalImageSignedUrl = await signedUrl(
        originalImageBucketName,
        originalImageFileName,
      );
      currentProfilePicture.originalImage.signedUrl = originalImageSignedUrl;
      const pendingImageSignedUrl = await signedUrl(
        pendingImageBucketName,
        pendingImageFileName,
      );
      currentProfilePicture.pendingImage.signedUrl = pendingImageSignedUrl;
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    ...user.toJSON(),
    currentProfilePicture: currentProfilePicture
      ? currentProfilePicture.toJSON()
      : null,
  });
};
