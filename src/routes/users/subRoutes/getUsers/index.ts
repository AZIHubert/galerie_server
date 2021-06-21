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
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
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
        confirmed: true,
        id: {
          [Op.not]: currentUser.id,
        },
        isBlackListed: false,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const returnedUser = users.map((user) => ({
    ...user.toJSON(),
    currentProfilePicture: null,
  }));

  console.log(returnedUser);

  return res.status(200).send({
    action: 'GET',
    data: {
      users: returnedUser,
    },
  });
};
