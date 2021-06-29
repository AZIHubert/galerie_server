import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
} from '#src/db/models';

import {
  galeriePictureExcluder,
} from '#src/helpers/excluders';
import gc from '#src/helpers/gc';
import signedUrl from '#src/helpers/signedUrl';

export default async (galerie: Galerie) => {
  const currentCoverPicture = await Frame.findOne({
    include: [{
      attributes: {
        exclude: galeriePictureExcluder,
      },
      include: [
        {
          as: 'cropedImage',
          model: Image,
        },
        {
          as: 'originalImage',
          model: Image,
        },
        {
          as: 'pendingImage',
          model: Image,
        },
      ],
      model: GaleriePicture,
      where: {
        current: true,
      },
    }],
    where: {
      galerieId: galerie.id,
    },
  });
  if (currentCoverPicture) {
    const {
      cropedImage,
      originalImage,
      pendingImage,
    } = currentCoverPicture.galeriePictures[0];
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
      await currentCoverPicture
        .galeriePictures[0]
        .destroy();
      await cropedImage.destroy();
      await originalImage.destroy();
      await pendingImage.destroy();
      return null;
    }
    const normalizeCurrentCoverPicrure = {
      ...currentCoverPicture
        .galeriePictures[0]
        .toJSON(),
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
    return normalizeCurrentCoverPicrure;
  }
  return null;
};
