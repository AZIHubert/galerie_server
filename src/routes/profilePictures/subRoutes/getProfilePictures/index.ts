// GET /profilePictures/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import {
  profilePictureExcluder,
} from '@src/helpers/excluders';
import {
  fetchProfilePicture,
} from '@root/src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const {
    previousProfilePicture,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const where: {
    autoIncrementId?: any
  } = {};
  let profilePictures: ProfilePicture[];
  let returnedProfilePictures: Array<any>;

  if (previousProfilePicture) {
    where.autoIncrementId = {
      [Op.lt]: previousProfilePicture,
    };
  }

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
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    returnedProfilePictures = await Promise.all(
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
      profilePictures: returnedProfilePictures,
    },
  });
};
