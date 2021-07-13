import {
  Includeable,
  Op,
} from 'sequelize';

import {
  Image,
  ProfilePicture,
  User,
} from '#src/db/models';

import gc from '#src/helpers/gc';
import signedUrl from '#src/helpers/signedUrl';

export default async (user: User, currentUser?: User) => {
  const where: { [key: string]: any} = {};
  const include: Includeable[] = [
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
  ];

  // If currentUser.role === 'user'
  // do not include reported profile picture.
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

  const currentProfilePicture = await ProfilePicture.findOne({
    attributes: {
      exclude: [
        'cropedImageId',
        'originalImageId',
        'pendingImageId',
        'updatedAt',
        'userId',
      ],
    },
    include,
    where: {
      ...where,
      userId: user.id,
      current: true,
    },
  });

  if (!currentProfilePicture) {
    return null;
  }

  const {
    cropedImage,
    originalImage,
    pendingImage,
  } = currentProfilePicture;

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
    return null;
  }
  return {
    ...currentProfilePicture.toJSON(),
    usersReporting: undefined,
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
