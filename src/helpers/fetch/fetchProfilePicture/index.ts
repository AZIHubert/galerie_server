import {
  ProfilePicture,
} from '#src/db/models';

import gc from '#src/helpers/gc';
import signedUrl from '#src/helpers/signedUrl';

export default async (profilePicture: ProfilePicture) => {
  const {
    cropedImage,
    originalImage,
  } = profilePicture;

  const cropedImageSignedUrl = await signedUrl(
    cropedImage.bucketName,
    cropedImage.fileName,
  );
  const originalImageSignedUrl = await signedUrl(
    originalImage.bucketName,
    originalImage.fileName,
  );

  if (
    !cropedImageSignedUrl.OK
    || !originalImageSignedUrl.OK
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
    await cropedImage.destroy();
    await originalImage.destroy();
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
  };
};
