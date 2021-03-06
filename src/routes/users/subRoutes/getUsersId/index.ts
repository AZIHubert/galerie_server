// GET /users/id/:userId/

import {
  Request,
  Response,
} from 'express';

import { User } from '#src/db/models';

import checkBlackList from '#src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import { userExcluder } from '#src/helpers/excluders';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUser = req.user as User;
  let user: User | null;
  let userIsBlackListed: boolean;

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Don't allow to fetch current user.
  // To do that, use GET /users/me instead.
  if (userId === currentUser.id) {
    return res.status(400).send({
      errors: 'params.id cannot be the same as your current one',
    });
  }

  // Fetch confirmed user with id.
  try {
    user = await User.findOne({
      attributes: {
        exclude: [
          ...userExcluder,
          'hasNewNotifications',
        ],
      },
      where: {
        confirmed: true,
        id: userId,
      },
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

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (userIsBlackListed) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Compose final returned user.
  const normalizedUser: any = {
    ...user.toJSON(),
    currentProfilePicture: null,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      user: normalizedUser,
    },
  });
};
