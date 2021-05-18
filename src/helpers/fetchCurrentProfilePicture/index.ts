import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import gc from '@src/helpers/gc';
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
      cropedImage,
      originalImage,
      pendingImage,
    } = currentProfilePicture;
    if (
      cropedImage
      && originalImage
      && pendingImage
    ) {
      const cropedImageSignedUrl = await signedUrl(
        cropedImage.bucketName,
        cropedImage.fileName,
      );
      const originalImageSignedUrl = await signedUrl(
        originalImage.bucketName,
        originalImage.fileName,
      );
      const pendingImageSignedUrl = await signedUrl(
        pendingImage.bucketName,
        pendingImage.fileName,
      );

      if (
        cropedImageSignedUrl.OK
        && originalImageSignedUrl.OK
        && pendingImageSignedUrl.OK
      ) {
        returnedCurrentProfilePicture = {
          ...currentProfilePicture.toJSON(),
          cropedImage: {
            ...cropedImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: cropedImageSignedUrl.signedUrl,
          },
          originalImage: {
            ...originalImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: originalImageSignedUrl.signedUrl,
          },
          pendingImage: {
            ...pendingImage.toJSON(),
            bucketName: undefined,
            fileName: undefined,
            signedUrl: pendingImageSignedUrl.signedUrl,
          },
        };
      } else {
        if (cropedImageSignedUrl.OK) {
          await gc
            .bucket(cropedImage.bucketName)
            .file(cropedImage.fileName)
            .delete();
        }
        if (originalImageSignedUrl.OK) {
          await gc
            .bucket(originalImage.bucketName)
            .file(originalImage.fileName)
            .delete();
        }
        if (pendingImageSignedUrl.OK) {
          await gc
            .bucket(pendingImage.bucketName)
            .file(pendingImage.fileName)
            .delete();
        }
        await cropedImage.destroy();
        await originalImage.destroy();
        await pendingImage.destroy();
        await currentProfilePicture.destroy();
      }
    } else {
      if (cropedImage) {
        await cropedImage.destroy();
        await gc
          .bucket(cropedImage.bucketName)
          .file(cropedImage.fileName)
          .delete();
      }
      if (originalImage) {
        await originalImage.destroy();
        await gc
          .bucket(originalImage.bucketName)
          .file(originalImage.fileName)
          .delete();
      }
      if (pendingImage) {
        await pendingImage.destroy();
        await gc
          .bucket(pendingImage.bucketName)
          .file(pendingImage.fileName)
          .delete();
      }
      await currentProfilePicture.destroy();
    }
  }

  return returnedCurrentProfilePicture;
};
