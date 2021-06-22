// POST /users/:userId/blackList/

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
import {
  normalizeJoiErrors,
  validatePostUsersIdBlackListsBody,
} from '@src/helpers/schemas';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUser = req.user as User;
  const objectBlackListExcluder: { [key: string]: undefined } = {};
  const objectUserExcluder: { [key: string]: undefined } = {};
  let blackList: BlackList;
  let user: User | null;

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // You cannot black list yourself.
  if (userId === currentUser.id) {
    return res.status(400).send({
      errors: 'you can\'t put your own account on the black list',
    });
  }

  // Fetch user.
  try {
    user = await User.findOne({
      where: {
        id: userId,
        confirmed: true,
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

  // Check if the role of the user
  // you want to black list is valid.
  if (user.role === 'superAdmin') {
    return res.status(400).send({
      errors: 'you can\'t black list a super admin',
    });
  }
  if (currentUser.role === 'admin' && user.role === 'admin') {
    return res.status(400).send({
      errors: 'you can\'t black list an admin',
    });
  }

  // Validate request.body
  const {
    error,
    value,
  } = validatePostUsersIdBlackListsBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // create blackList.
  try {
    blackList = await BlackList.create({
      createdById: currentUser.id,
      reason: value.reason,
      time: value.time
        ? new Date(Date.now() + value.time)
        : null,
      userId,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Set user.isBlackListed === true.
  try {
    await user.update({
      isBlackListed: true,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // normalize blackList.
  blackListExcluder.forEach((e) => {
    objectBlackListExcluder[e] = undefined;
  });
  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });
  const normalizeBlackList = {
    ...blackList.toJSON(),
    ...objectBlackListExcluder,
    active: true,
    createdBy: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
    },
    updatedBy: null,
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      blackList: normalizeBlackList,
      userId,
    },
  });
};
