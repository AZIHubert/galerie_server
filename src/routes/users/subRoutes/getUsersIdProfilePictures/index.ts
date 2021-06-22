// Get /users/:userId/profilePictures/

import {
  Request,
  Response,
} from 'express';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  profilePictureExcluder,
} from '@src/helpers/excluders';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';
import {
  fetchProfilePicture,
} from '@root/src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const {
    userId,
  } = req.params;
  const limit = 20;
  let user: User | null;
  let normalizedProfilePictures;
  let offset: number;
  let profilePictures: ProfilePicture[];

  // Check if request.params.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Fetch profile pictures.
  try {
    profilePictures = await ProfilePicture.findAll({
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
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Normalize profile pictures.
  try {
    normalizedProfilePictures = await Promise.all(
      profilePictures.map(async (profilePicture) => {
        const normalizeProfilePicture = await fetchProfilePicture(profilePicture);
        return normalizeProfilePicture;
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      profilePictures: normalizedProfilePictures,
      userId,
    },
  });
};
