// GET /blackLists/:blackListId/

import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  blackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { blackListId } = req.params;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let blackList: BlackList | null;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(blackListId)) {
    return res.status(400).send({
      errors: INVALID_UUID('black list'),
    });
  }

  // Fetch black list.
  try {
    blackList = await BlackList.findByPk(blackListId, {
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
        {
          as: 'user',
          model: User,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if black list exist.
  if (!blackList) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('black list'),
    });
  }

  // Check if black list is expired.
  if (blackList.time && blackList.time < new Date(Date.now())) {
    try {
      await blackList.user.update({
        blackListedAt: null,
        isBlackListed: false,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  const returnedBlackList = {
    ...blackList.toJSON(),
    active: blackList.user.isBlackListed,
    createdBy: blackList.createdBy ? {
      ...blackList.createdBy.toJSON(),
      currentProfilePicture: null,
    } : null,
    updatedBy: blackList.updatedBy ? {
      ...blackList.updatedBy.toJSON(),
      currentProfilePicture: null,
    } : null,
    user: {
      ...blackList.user.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
    },
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      blackList: returnedBlackList,
    },
  });
};
