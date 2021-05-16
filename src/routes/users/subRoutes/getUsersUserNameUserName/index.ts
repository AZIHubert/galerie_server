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
  const { id } = req.user as User;
  const limit = 20;
  const { userName } = req.params;
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const usersWithProfilePicture: Array<any> = [];
  let direction = 'DESC';
  let offset: number;
  let order = 'createdAt';
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
        userName: {
          [Op.iLike]: `%${userName.toLowerCase()}%`,
        },
      },
    });

    // Fetch current profile pictures
    // and their signed url.
    await Promise.all(
      users.map(async (user) => {
        const userIsBlackListed = await checkBlackList(user);
        let currentProfilePicture;

        if (!userIsBlackListed) {
          currentProfilePicture = await fetchCurrentProfilePicture(user);
          const userWithProfilePicture: any = {
            ...user.toJSON(),
            currentProfilePicture,
          };
          delete userWithProfilePicture.blackList;
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
