// GET /blackLists/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const {
    direction: queryDirection,
    page,
  } = req.query;
  const limit = 20;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let direction = 'DESC';
  let offset: number;
  let returnedBlackLists: Array<any> = [];
  let users:Array<User>;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  // Fetch blackLists.
  try {
    users = await User.findAll({
      include: [
        {
          as: 'blackListsUser',
          attributes: {
            exclude: blackListExcluder,
          },
          include: [
            {
              as: 'createdBy',
              attributes: {
                exclude: userExcluder,
              },
              model: User,
            },
            {
              as: 'updatedBy',
              attributes: {
                exclude: userExcluder,
              },
              model: User,
            },
          ],
          order: [['createdAt', 'DESC']],
          model: BlackList,
          where: {
            [Op.or]: [
              {
                time: {
                  [Op.gte]: new Date(Date.now()),
                },
              },
              {
                time: null,
              },
            ],
          },
        },
      ],
      limit,
      offset,
      order: [['blackListedAt', direction]],
      where: {
        isBlackListed: true,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Get black listed createdBy/updatedBy/user's
  // current profile picture  with their signed url.
  returnedBlackLists = users.map((user) => {
    const {
      blackListsUser: [{
        createdBy,
        updatedBy,
      }],
    } = user;

    userExcluder.forEach((e) => {
      objectUserExcluder[e] = undefined;
    });

    return {
      ...user.blackListsUser[0].toJSON(),
      createdBy: createdBy ? {
        ...createdBy.toJSON(),
        currentProfilePicture: null,
      } : null,
      active: true,
      updatedBy: updatedBy ? {
        ...updatedBy.toJSON(),
        currentProfilePicture: null,
      } : null,
      user: {
        ...user.toJSON(),
        ...objectUserExcluder,
        currentProfilePicture: null,
      },
    };
  });

  return res.status(200).send({
    action: 'GET',
    data: {
      blackLists: returnedBlackLists,
    },
  });
};
