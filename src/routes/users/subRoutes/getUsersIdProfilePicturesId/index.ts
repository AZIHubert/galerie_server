// GET /users/:userId/profilePictures/:profilePictureId

import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  profilePictureExcluder,
} from '#src/helpers/excluders';
import {
  fetchProfilePicture,
} from '#src/helpers/fetch';
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
          attributes: {
            exclude: profilePictureExcluder,
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

  // Normalize profile picture.
  const normalizeProfilePicture = await fetchProfilePicture(user.profilePictures[0]);

  if (!normalizeProfilePicture) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('profile picture'),
    });
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      profilePicture: normalizeProfilePicture,
      userId,
    },
  });
};
