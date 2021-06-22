import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import { userExcluder } from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const { userName } = req.params;
  const {
    blackListed,
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const limit = 20;
  const where: {
    isBlackListed?: boolean;
  } = {};
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
  if (currentUser.role !== 'user') {
    switch (blackListed) {
      case 'true':
        where.isBlackListed = true;
        break;
      case 'false':
        where.isBlackListed = false;
        break;
      default:
        break;
    }
  } else {
    where.isBlackListed = false;
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
        ...where,
        confirmed: true,
        id: {
          [Op.not]: currentUser.id,
        },
        userName: {
          [Op.iLike]: `%${userName.toLowerCase()}%`,
        },
      },
    });

    // Fetch current profile pictures
    // and their signed url.
    returnedUsers = users.map((user) => ({
      ...user.toJSON(),
      currentProfilePicture: null,
    }));
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
