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

export default async (req: Request, res: Response) => {
  const {
    email,
  } = req.params;
  const {
    page,
  } = req.query;
  const limit = 20;
  let betaKeys: Array<BetaKey>;
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Fetch betaKeys.
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
      order: [['createdAt', 'DESC']],
      where: {
        email: {
          [Op.iLike]: `%${email.toLowerCase()}%`,
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

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
