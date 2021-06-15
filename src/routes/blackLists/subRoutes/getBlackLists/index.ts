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
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

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
              as: 'admin',
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

  try {
    // Get black listed admin/updatedBy/user's
    // current profile picture  with their signed url.
    returnedBlackLists = await Promise.all(
      users.map(async (user) => {
        const {
          blackListsUser: [{
            admin,
            updatedBy,
          }],
        } = user;
        const currentProfilePicture = await fetchCurrentProfilePicture(user);
        let adminCurrentProfilePicture;
        let updatedByCurrentProfilePicture;

        if (admin) {
          adminCurrentProfilePicture = await fetchCurrentProfilePicture(admin);
        }
        if (user.blackListsUser[0].updatedBy) {
          updatedByCurrentProfilePicture = await fetchCurrentProfilePicture(updatedBy);
        }

        userExcluder.forEach((e) => {
          objectUserExcluder[e] = undefined;
        });

        return {
          ...user.blackListsUser[0].toJSON(),
          admin: admin ? {
            ...admin.toJSON(),
            currentProfilePicture: adminCurrentProfilePicture,
          } : null,
          active: true,
          updatedBy: updatedBy ? {
            ...updatedBy.toJSON(),
            currentProfilePicture: updatedByCurrentProfilePicture,
          } : null,
          user: {
            ...user.toJSON(),
            ...objectUserExcluder,
            currentProfilePicture,
          },
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      blackLists: returnedBlackLists,
    },
  });
};
