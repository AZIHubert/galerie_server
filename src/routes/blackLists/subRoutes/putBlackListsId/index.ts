// PUT /blackLists/:blackListId/

import {
  Request,
  Response,
} from 'express';

import {
  User,
  BlackList,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const { blackListId } = req.params;
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
      include: [
        {
          as: 'admin',
          model: User,
        },
        {
          as: 'user',
          model: User,
          required: false,
          where: {
            isBlackListed: true,
          },
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

  // Check if blackList is active.
  if (!blackList.user) {
    return res.status(400).send({
      errors: 'not allow to update a non active black list',
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
    return res.status(400).send({
      errors: 'not allow to update a non active black list',
    });
  }

  // admin are not allow to
  // update blackList posted by
  // superAdmin.
  if (
    currentUser.role === 'admin'
    && blackList.admin.role === 'superAdmin'
  ) {
    return res.status(400).send({
      errors: 'you\'re not allow to update this blackList',
    });
  }

  // Set active to false.
  try {
    await blackList.update({
      updatedById: currentUser.id,
    });
    await blackList.user.update({
      blackListedAt: null,
      isBlackListed: false,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      blackListId,
    },
  });
};
