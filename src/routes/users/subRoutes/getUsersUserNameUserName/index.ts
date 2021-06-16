import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import { userExcluder } from '@src/helpers/excluders';
import { fetchCurrentProfilePicture } from '@root/src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const { id } = req.user as User;
  const limit = 20;
  const { userName } = req.params;
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  let direction = 'ASC';
  let offset: number;
  let order = 'pseudonym';
  let returnedUsers;
  let users: User[];

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  if (
    queryOrder === 'createdAt'
    || queryOrder === 'pseudonym'
    || queryOrder === 'userName'
  ) {
    order = queryOrder;
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    // Fetch all user which matches with requested userName
    users = await User.findAll({
      attributes: {
        exclude: userExcluder,
      },
      limit,
      offset,
      order: [[order, direction]],
      where: {
        confirmed: true,
        id: {
          [Op.not]: id,
        },
        isBlackListed: false,
        userName: {
          [Op.iLike]: `%${userName.toLowerCase()}%`,
        },
      },
    });

    // Fetch current profile pictures
    // and their signed url.
    returnedUsers = await Promise.all(
      users.map(async (user) => {
        const currentProfilePicture = await fetchCurrentProfilePicture(user);
        return {
          ...user.toJSON(),
          currentProfilePicture,
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      users: returnedUsers,
    },
  });
};
