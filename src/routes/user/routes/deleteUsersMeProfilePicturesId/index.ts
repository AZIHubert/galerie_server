import { Response, Request } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import gc from '@src/helpers/gc';
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user as User;
  if (!currentUser) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  const { id: userId, currentProfilePictureId } = currentUser;
  let profilePicture: ProfilePicture | null;
  if (currentProfilePictureId === id) {
    try {
      await currentUser.update({ currentProfilePictureId: null });
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  try {
    profilePicture = await ProfilePicture.findOne({
      where: {
        id,
        userId,
      },
      include: [
        {
          all: true,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }
  const {
    originalImage,
    cropedImage,
    pendingImage,
  } = profilePicture;
  try {
    await profilePicture.update({
      cropedImageId: null,
      originalImageId: null,
      pendingImageId: null,
    });
    await gc
      .bucket(originalImage.bucketName)
      .file(originalImage.fileName)
      .delete();
    await Image.destroy({
      where: {
        id: originalImage.id,
      },
    });
    await gc
      .bucket(cropedImage.bucketName)
      .file(cropedImage.fileName)
      .delete();
    await Image.destroy({
      where: {
        id: cropedImage.id,
      },
    });
    await gc
      .bucket(pendingImage.bucketName)
      .file(pendingImage.fileName)
      .delete();
    await Image.destroy({
      where: {
        id: pendingImage.id,
      },
    });
    await profilePicture.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    type: 'DELETE',
    id,
  });
};
