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
  } = currentCoverPicture.galeriePictures[0];
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
    await currentCoverPicture
      .galeriePictures[0]
      .destroy();
    await cropedImage.destroy();
    await originalImage.destroy();
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
  };
  return normalizeCurrentCoverPicrure;
};
