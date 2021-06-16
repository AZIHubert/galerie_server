import {
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BlackList,
  User,
} from '@src/db/models';

export default async (_: any, res: Response) => {
  try {
    const expiredBlackListedUser = await User.findAll({
      include: [
        {
          as: 'blackListsUser',
          model: BlackList,
          where: {
            time: {
              [Op.lt]: new Date(Date.now()),
            },
          },
        },
      ],
      where: {
        isBlackListed: true,
      },
    });
    await Promise.all(
      expiredBlackListedUser.map(async (user) => {
        await user.update({
          blackListedAt: null,
          isBlackListed: false,
        });
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(204).send();
};
