import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import signedUrl from '@src/helpers/signedUrl';

export default async (user: User, exlude?: Array<string>) => {
  let returnedCurrentProfilePicture = null;

  const currentProfilePicture = await ProfilePicture.findOne({
    attributes: {
      exclude: exlude || [
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
            'id',
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
            'id',
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
            'id',
            'updatedAt',
          ],
        },
        model: Image,
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
    const originalImageSignedUrl = await signedUrl(
      originalImageBucketName,
      originalImageFileName,
    );
    const pendingImageSignedUrl = await signedUrl(
      pendingImageBucketName,
      pendingImageFileName,
    );

    returnedCurrentProfilePicture = {
      ...currentProfilePicture.toJSON(),
      cropedImage: {
        ...currentProfilePicture.cropedImage.toJSON(),
        bucketName: undefined,
        fileName: undefined,
        signedUrl: cropedImageSignedUrl,
      },
      originalImage: {
        ...currentProfilePicture.originalImage.toJSON(),
        bucketName: undefined,
        fileName: undefined,
        signedUrl: originalImageSignedUrl,
      },
      pendingImage: {
        ...currentProfilePicture.pendingImage.toJSON(),
        bucketName: undefined,
        fileName: undefined,
        signedUrl: pendingImageSignedUrl,
      },
    };
  }

  return returnedCurrentProfilePicture;
};
