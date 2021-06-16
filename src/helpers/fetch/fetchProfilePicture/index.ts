import {
  ProfilePicture,
} from '@src/db/models';

import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';

export default async (profilePicture: ProfilePicture) => {
  const {
    cropedImage,
    originalImage,
    pendingImage,
  } = profilePicture;

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
    !cropedImageSignedUrl.OK
    || !originalImageSignedUrl.OK
    || !pendingImageSignedUrl.OK
  ) {
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
    await profilePicture.destroy();
    return null;
  }

  return {
    ...profilePicture.toJSON(),
    cropedImage: {
      ...cropedImage.toJSON(),
      bucketName: undefined,
      createdAt: undefined,
      fileName: undefined,
      id: undefined,
      signedUrl: cropedImageSignedUrl.signedUrl,
      updatedAt: undefined,
    },
    originalImage: {
      ...originalImage.toJSON(),
      bucketName: undefined,
      createdAt: undefined,
      fileName: undefined,
      id: undefined,
      signedUrl: originalImageSignedUrl.signedUrl,
      updatedAt: undefined,
    },
    pendingImage: {
      ...pendingImage.toJSON(),
      bucketName: undefined,
      createdAt: undefined,
      fileName: undefined,
      id: undefined,
      signedUrl: pendingImageSignedUrl.signedUrl,
      updatedAt: undefined,
    },
  };
};
