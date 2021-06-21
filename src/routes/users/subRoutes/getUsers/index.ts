// GET /users/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import {
  userExcluder,
} from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const {
    blackListed,
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const where: {
    isBlackListed?: boolean;
  } = {};
  let direction = 'ASC';
  let offset: number;
  let order = 'pseudonym';
  let users: Array<User>;

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

  // fetch users exept current one,
  // black listed and not confirmed.
  try {
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
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const normalizedUsers = users.map((user) => ({
    ...user.toJSON(),
    currentProfilePicture: null,
  }));

  return res.status(200).send({
    action: 'GET',
    data: {
      users: normalizedUsers,
    },
  });
};
