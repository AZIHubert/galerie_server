import { Response, Request } from 'express';
import { Op } from 'sequelize';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user as User;

  // Check if profile picture exist.
  let profilePicture: ProfilePicture | null;
  try {
    profilePicture = await ProfilePicture.findOne({
      include: [
        {
          all: true,
        },
      ],
      where: {
        id,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }

  // Delete profile picture/images
  // and all image from Google buckets.
  const {
    cropedImage,
    originalImage,
    pendingImage,
  } = profilePicture;
  try {
    await profilePicture.destroy();
    await Image.destroy({
      where: {
        [Op.or]: [
          {
            id: cropedImage.id,
          },
          {
            id: originalImage.id,
          },
          {
            id: pendingImage.id,
          },
        ],
      },
    });
    await gc
      .bucket(originalImage.bucketName)
      .file(originalImage.fileName)
      .delete();
    await gc
      .bucket(cropedImage.bucketName)
      .file(cropedImage.fileName)
      .delete();
    await gc
      .bucket(pendingImage.bucketName)
      .file(pendingImage.fileName)
      .delete();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    id,
  });
};
