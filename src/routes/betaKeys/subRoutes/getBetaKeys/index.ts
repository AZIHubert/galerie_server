// GET /betaKeys/

import {
  Request,
  Response,
} from 'express';
import {
  Op,
} from 'sequelize';

import {
  BetaKey,
  User,
} from '@src/db/models';

import {
  betaKeyExcluder,
  userExcluder,
} from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const limit = 20;
  const {
    me,
    page,
    used,
  } = req.query;
  let betaKeys: Array<BetaKey>;
  const where: {
    createdById?: string;
    userId?: any;
  } = {};
  let offset: number;

  // If ?me='false'
  // return all betaKey created
  // by any users.
  switch (me) {
    case 'true':
      where.createdById = currentUser.id;
      break;
    case 'false':
      break;
    default:
      where.createdById = currentUser.id;
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  switch (used) {
    // If ?used='true'
    // return only used betaKey.
    case 'true':
      where.userId = {
        [Op.not]: null,
      };
      break;
    // If ?used='false'
    // return only not used betaKey.
    case 'false':
      where.userId = {
        [Op.eq]: null,
      };
      break;
    default:
      break;
  }

  // Fetch betakeys.
  try {
    betaKeys = await BetaKey.findAll({
      attributes: {
        exclude: betaKeyExcluder,
      },
      include: [
        {
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          as: 'createdBy',
          model: User,
        },
        {
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          as: 'user',
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Normalize betaKeys.
  const normalizeBetaKeys = betaKeys.map((betaKey) => ({
    ...betaKey.toJSON(),
    createdBy: !betaKey.createdBy ? null : {
      ...betaKey.createdBy.toJSON(),
      currentProfilePicture: null,
    },
    user: !betaKey.user ? null : {
      ...betaKey.user.toJSON(),
      currentProfilePicture: null,
    },
  }));

  return res.status(200).send({
    action: 'GET',
    data: {
      betaKeys: normalizeBetaKeys,
    },
  });
};
