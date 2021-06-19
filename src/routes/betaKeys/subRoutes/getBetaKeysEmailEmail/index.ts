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
  const {
    email,
  } = req.params;
  const {
    page,
  } = req.query;
  const limit = 20;
  let betaKeys: Array<BetaKey>;
  let normalizeBetaKeys: Array<any>;
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
