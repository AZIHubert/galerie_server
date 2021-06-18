// GET /betaKeys/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  BetaKey,
  User,
} from '@src/db/models';

import {
  betaKeyExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import {
  fetchCurrentProfilePicture,
} from '@src/helpers/fetch';

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
    usedAt?: any;
  } = {};
  let normalizeBetaKeys: Array<any>;
  let offset: number;

  // If ?me='true'
  // return only betaKey created
  // by current user.
  if (me === 'true') {
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
      where.usedAt = {
        [Op.not]: null,
      };
      break;
    // If ?used='false'
    // return only not used betaKey.
    case 'false':
      where.usedAt = {
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
            exclude: userExcluder,
          },
          as: 'createdBy',
          model: User,
        },
        {
          attributes: {
            exclude: userExcluder,
          },
          as: 'user',
          model: User,
        },
      ],
      limit,
      offset,
      order: [
        ['usedAt', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      where,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  // Normalize betaKeys.
  try {
    normalizeBetaKeys = await Promise.all(
      betaKeys.map(async (betaKey) => {
        let createdByCurrentProfilePicture;
        let userCurrentProfilePicture;
        if (betaKey.createdBy) {
          createdByCurrentProfilePicture = await fetchCurrentProfilePicture(betaKey.createdBy);
        }
        if (betaKey.user) {
          userCurrentProfilePicture = await fetchCurrentProfilePicture(betaKey.user);
        }
        return {
          ...betaKey.toJSON(),
          createdBy: !betaKey.createdBy ? null : {
            ...betaKey.createdBy.toJSON(),
            currentProfilePicture: createdByCurrentProfilePicture,
          },
          user: !betaKey.user ? null : {
            ...betaKey.user.toJSON(),
            currentProfilePicture: userCurrentProfilePicture,
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
      betaKeys: normalizeBetaKeys,
    },
  });
};
