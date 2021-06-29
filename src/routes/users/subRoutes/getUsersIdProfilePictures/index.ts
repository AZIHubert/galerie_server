// Get /users/:userId/profilePictures/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

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
import uuidValidateV4 from '#src/helpers/uuidValidateV4';
import {
  fetchProfilePicture,
} from '#src/helpers/fetch';
import isNormalInteger from '#src/helpers/isNormalInteger';

export default async (req: Request, res: Response) => {
  const {
    previousProfilePicture,
  } = req.query;
  const {
    userId,
  } = req.params;
  const limit = 20;
  const where: {
    autoIncrementId?: any
  } = {};
  let user: User | null;
  let normalizedProfilePictures;
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

  if (previousProfilePicture && isNormalInteger(previousProfilePicture.toString())) {
    where.autoIncrementId = {
      [Op.lt]: previousProfilePicture.toString(),
    };
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
      order: [['autoIncrementId', 'DESC']],
      where: {
        ...where,
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
