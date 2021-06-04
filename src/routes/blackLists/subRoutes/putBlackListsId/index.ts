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
  normalizeJoiErrors,
  validatePutBlackListsIdBody,
} from '@src/helpers/schemas';
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

  // Check if blackList.user exist.
  if (!blackList.user) {
    try {
      await blackList.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('black list'),
    });
  }

  // Check if black list is expired.
  if (blackList.time) {
    const time = new Date(
      blackList.createdAt.getTime() + blackList.time,
    );
    const blackListIsExpired = time < new Date(Date.now());

    if (blackListIsExpired) {
      try {
        await blackList.destroy();
      } catch (err) {
        return res.status(500).send(err);
      }
      return res.status(404).send({
        errors: MODEL_NOT_FOUND('black list'),
      });
    }
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePutBlackListsIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  if ((value.time || null) === blackList.time) {
    return res.status(400).send({
      errors: 'no change submited',
    });
  }

  // Update black list.
  try {
    await blackList.update({
      time: value.time || null,
      updatedById: currentUser.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      blackListId,
      time: value.time || null,
      updatedAt: blackList.updatedAt,
    },
  });
};
