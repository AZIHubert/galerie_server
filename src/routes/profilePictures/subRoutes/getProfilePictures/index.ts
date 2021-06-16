// GET /profilePictures/

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
  profilePictureExcluder,
} from '@src/helpers/excluders';
import { fetchProfilePicture } from '@root/src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  let offset: number;
  let profilePictures: ProfilePicture[];
  let returnedProfilePictures: Array<any>;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
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
      offset,
      order: [['createdAt', 'DESC']],
      where: {
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
