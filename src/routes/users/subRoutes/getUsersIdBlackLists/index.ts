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
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    previousBlackList,
  } = req.query;
  const {
    userId,
  } = req.params;
  const limit = 20;
  const where: {
    autoIncrementId?: any
  } = {};
  let blackLists: BlackList[];
  let user: User | null;

  // Check if request.params.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  if (previousBlackList) {
    where.autoIncrementId = {
      [Op.lt]: previousBlackList,
    };
  }

  // Fetch blackLists.
  try {
    blackLists = await BlackList.findAll({
      attributes: {
        exclude: blackListExcluder,
      },
      include: [
        {
          as: 'createdBy',
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          model: User,
        },
        {
          as: 'updatedBy',
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          model: User,
        },
      ],
      limit,
      order: [['autoIncrementId', 'DESC']],
      where: {
        ...where,
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Normalize blackLists.
  const normalizeBlackLists = blackLists.map((blackList) => ({
    ...blackList.toJSON(),
    createdBy: !blackList.createdBy ? null : {
      ...blackList.createdBy.toJSON(),
      currentProfilePicture: null,
    },
    updatedBy: !blackList.updatedBy ? null : {
      ...blackList.updatedBy.toJSON(),
      currentProfilePicture: null,
    },
  }));

  return res.status(200).send({
    action: 'GET',
    data: {
      userId,
      blackLists: normalizeBlackLists,
    },
  });
};
