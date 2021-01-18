import { Response, Request } from 'express';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import gc from '@src/helpers/gc';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user } = res.locals;
  const { id: userId, currentProfilePicture } = user;
  let profilePicture: ProfilePicture | null;
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
    await ProfilePicture.destroy({
      where: { id },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (currentProfilePicture === id) {
    try {
      await user.update({ currentProfilePicture: null });
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  return res.status(200).send({ id });
};
