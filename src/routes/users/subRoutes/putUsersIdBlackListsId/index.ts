// PUT /users/:userId/blackLists/

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
  const {
    userId,
  } = req.params;
  const currentUser = req.user as User;
  let user: User | null;

  // Check if request.params.blackListId is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [
        {
          as: 'blackListsUser',
          include: [
            {
              as: 'createdBy',
              model: User,
            },
          ],
          limit: 1,
          order: [['createdAt', 'DESC']],
          model: BlackList,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Check if if user.blackList === false
  // or if user has no blackList.
  if (user.isBlackListed === false || !user.blackListsUser[0]) {
    // If user.isBlackListed === true
    // but no blackLists are associated
    // to it, set user.isBlackListed === false.
    if (user.isBlackListed) {
      try {
        await user.update({ isBlackListed: false });
      } catch (err) {
        return res.status(500).send(err);
      }
    }
    return res.status(400).send({
      errors: 'user is not black listed',
    });
  }

  // Check if black list is expired.
  if (
    user.blackListsUser[0].time
    && user.blackListsUser[0].time < new Date(Date.now())
  ) {
    try {
      await user.update({
        isBlackListed: false,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(400).send({
      errors: 'user is not black listed',
    });
  }

  // admin are not allow to
  // update blackList posted by
  // superAdmin.
  if (
    user.blackListsUser[0].createdBy
    && (
      currentUser.role === 'admin'
      && user.blackListsUser[0].createdBy.role === 'superAdmin'
    )
  ) {
    return res.status(400).send({
      errors: 'you\'re not allow to update this blackList',
    });
  }

  // Set active to false.
  try {
    await user.blackListsUser[0].update({
      updatedById: currentUser.id,
    });
    await user.update({
      isBlackListed: false,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      userId,
    },
  });
};
