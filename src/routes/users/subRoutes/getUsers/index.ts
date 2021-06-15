import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const { id } = req.user as User;
  const limit = 20;
  const usersWithProfilePicture: Array<any> = [];
  let direction = 'DESC';
  let offset: number;
  let order = 'createdAt';

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
    // Get all users exept current one,
    // black listed and not confirmed.
    const users = await User.findAll({
      attributes: {
        exclude: userExcluder,
      },
      limit,
      offset,
      order: [[order, direction]],
      where: {
        confirmed: true,
        // TODO:
        // isBlackListed: false,
        id: {
          [Op.not]: id,
        },
      },
    });

    await Promise.all(
      users.map(async (user) => {
        // Check user is not black listed.
        // If true, do not push user
        // into final returned users.
        const userIsBlackListed = await checkBlackList(user);

        if (!userIsBlackListed) {
          // Fetch current profile picture.
          const currentProfilePicture = await fetchCurrentProfilePicture(user);

          const userWithProfilePicture: any = {
            ...user.toJSON(),
            currentProfilePicture,
          };

          usersWithProfilePicture.push(userWithProfilePicture);
        }
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      users: usersWithProfilePicture,
    },
  });
};
