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
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import {
  normalizeJoiErrors,
  validatePostBlackListsUserIdBody,
} from '@src/helpers/schemas';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const objectBlackListExcluder: { [key: string]: undefined } = {};
  const objectUserExcluder: { [key: string]: undefined } = {};
  const { userId } = req.params;
  let adminCurrentProfilePicture;
  let blackList: BlackList;
  let currentProfilePicture;
  let user: User | null;

  // TODO:
  // Check if user have active black listed
  // active = true
  // set all active blackList to false.

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
      attributes: {
        exclude: userExcluder,
      },
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

  // Set all active BlackLists to false.
  try {
    await BlackList.update({
      active: false,
    }, {
      where: {
        userId,
        active: true,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const {
    error,
    value,
  } = validatePostBlackListsUserIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    // create blackList.
    blackList = await BlackList.create({
      adminId: currentUser.id,
      reason: value.reason,
      time: value.time
        ? new Date(Date.now() + value.time)
        : null,
      userId,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch black listed user current profile picture.
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch admin current profile picture.
  try {
    adminCurrentProfilePicture = await fetchCurrentProfilePicture(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }

  blackListExcluder.forEach((e) => {
    objectBlackListExcluder[e] = undefined;
  });
  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  const returnedBlackList = {
    ...blackList.toJSON(),
    ...objectBlackListExcluder,
    admin: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: adminCurrentProfilePicture,
    },
    updatedBy: null,
    user: {
      ...user.toJSON(),
      currentProfilePicture,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      blackList: returnedBlackList,
    },
  });
};
