import {
  Request,
  Response,
} from 'express';

import {
  ProfilePicture,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import gc from '#src/helpers/gc';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    profilePictureId,
    userId,
  } = req.params;
  let user: User | null;

  // Check if request.params.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Check if request.params.profilePictureId is a UUIDv4.
  if (!uuidValidateV4(profilePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('profile picture'),
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [
        {
          as: 'profilePictures',
          include: [
            {
              all: true,
            },
          ],
          model: ProfilePicture,
          required: false,
          where: {
            id: profilePictureId,
          },
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Check is profile picture exist.
  if (!user.profilePictures[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('profile picture'),
    });
  }

  const {
    cropedImage,
    originalImage,
  } = user.profilePictures[0];

  try {
    await user.profilePictures[0].destroy();
    await gc
      .bucket(originalImage.bucketName)
      .file(originalImage.fileName)
      .delete();
    await gc
      .bucket(cropedImage.bucketName)
      .file(cropedImage.fileName)
      .delete();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      profilePictureId,
      userId,
    },
  });
};
