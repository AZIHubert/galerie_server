// GET /betaKeys/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BetaKey,
  User,
} from '#src/db/models';

import {
  betaKeyExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import isNormalInteger from '#src/helpers/isNormalInteger';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const limit = 20;
  const {
    email,
    me,
    previousBetaKey,
    used,
  } = req.query;
  const where: {
    email?: any;
    autoIncrementId?: any;
    createdById?: string;
    userId?: any;
  } = {};
  let betaKeys: Array<BetaKey>;

  if (email) {
    where.email = {
      [Op.iLike]: `%${email.toString().trim().toLowerCase()}%`,
    };
  }

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

  if (previousBetaKey && isNormalInteger(previousBetaKey.toString())) {
    where.autoIncrementId = {
      [Op.lt]: previousBetaKey.toString(),
    };
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
      order: [['autoIncrementId', 'DESC']],
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
