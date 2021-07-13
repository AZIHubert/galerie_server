import {
  Includeable,
  Op,
} from 'sequelize';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '#src/db/models';

import {
  galeriePictureExcluder,
} from '#src/helpers/excluders';
import gc from '#src/helpers/gc';
import signedUrl from '#src/helpers/signedUrl';

export default async (galerie: Galerie, currentUser?: {
  id: string;
  role: 'admin' | 'moderator' | 'user'
}) => {
  const include: Includeable[] = [
    {
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
    },
  ];
  const where: { [key: string]: any } = {};

  // Do not include reported coverPicture if
  // currentUser's role for this galerie is 'user'.
  if (currentUser && currentUser.role === 'user') {
    include.push({
      as: 'usersReporting',
      duplicating: false,
      model: User,
      required: false,
      where: {
        id: currentUser.id,
      },
    });
    where['$usersReporting.id$'] = {
      [Op.eq]: null,
    };
  }

  const currentCoverPicture = await Frame.findOne({
    include,
    subQuery: false,
    where: {
      ...where,
      galerieId: galerie.id,
    },
  });

  if (!currentCoverPicture) {
    return null;
  }

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
};
