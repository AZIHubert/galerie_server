import {
  Frame,
} from '@src/db/models';

import gc from '@src/helpers/gc';
import signedUrl from '@src/helpers/signedUrl';

export default async (frame: Frame) => {
  const galeriePictures = await Promise.all(
    frame.galeriePictures
      .map(async (galeriePicture) => {
        const {
          cropedImage,
          originalImage,
          pendingImage,
        } = galeriePicture;

        // If one of the image doesn't
        // exist, but one of them exist,
        // destroy the Google images
        // and the existing Image.
        // Destroy the galerieImage
        // and return null.

        // if (
        //   !cropedImage
        //   || !originalImage
        //   || !pendingImage
        // ) {
        //   if (cropedImage) {
        //     await cropedImage.destroy();
        //     await gc
        //       .bucket(cropedImage.bucketName)
        //       .file(cropedImage.fileName)
        //       .delete();
        //   }
        //   if (originalImage) {
        //     await originalImage.destroy();
        //     await gc
        //       .bucket(originalImage.bucketName)
        //       .file(originalImage.fileName)
        //       .delete();
        //   }
        //   if (pendingImage) {
        //     await pendingImage.destroy();
        //     await gc
        //       .bucket(pendingImage.bucketName)
        //       .file(pendingImage.fileName)
        //       .delete();
        //   }
        //   await galeriePicture.destroy();
        //   return null;
        // }

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

        // If all images exist but one of them
        // don't have a valid signedUrl,
        // destroy the Google image from the one
        // with a valid signedUrl,
        // destroy all three Image
        // destroy the galeriePicture
        // and return null.
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
          await galeriePicture.destroy();
          await cropedImage.destroy();
          await originalImage.destroy();
          await pendingImage.destroy();
          return null;
        }

        // return normalize galeriePicture.
        return {
          ...galeriePicture.toJSON(),
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
      }),
  );

  const filteredGaleriePicture = galeriePictures
    .filter((galeriePicture) => !!galeriePicture);

  // If frame don't have galeriePictures
  // destroy frame and return null.
  if (filteredGaleriePicture.length === 0) {
    return null;
  }

  return {
    ...frame.toJSON(),
    galeriePictures: filteredGaleriePicture,
  };
};
