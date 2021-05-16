import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import {
  normalizeJoiErrors,
  validatePostUsersBlacklistIdBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUser = req.user as User;
  let blackList: BlackList;
  let returnedBlackList;
  let user: User | null;
  let userIsBlackListed: boolean;

  // You cannot black list yourself.
  if (userId === currentUser.id) {
    return res.status(401).send({
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
      errors: USER_NOT_FOUND,
    });
  }

  // Check if the role of the user
  // you want to black list is valid.
  if (user.role === 'superAdmin') {
    return res.status(401).send({
      errors: 'you can\'t black listed a super admin',
    });
  }
  if (currentUser.role === 'admin' && user.role === 'admin') {
    return res.status(401).send({
      errors: 'you can\'t black listed an admin',
    });
  }

  // Check if user is already blackListed.
  try {
    userIsBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (userIsBlackListed) {
    return res.status(400).send({
      errors: 'user is already black listed',
    });
  }

  const {
    error,
    value,
  } = validatePostUsersBlacklistIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    // Set user role to 'user'.
    await user.update({ role: 'user' });

    // create blackList.
    blackList = await BlackList.create({
      adminId: userId,
      reason: value.reason,
      time: value.time ? value.time : null,
      userId: user.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    const currentProfilePicture = await fetchCurrentProfilePicture(user);
    const adminCurrentProfilePicture = await fetchCurrentProfilePicture(currentUser);
    returnedBlackList = {
      ...blackList.toJSON(),
      admin: {
        ...currentUser.toJSON(),
        authTokenVersion: undefined,
        confirmed: undefined,
        confirmTokenVersion: undefined,
        currentProfilePicture: adminCurrentProfilePicture,
        email: undefined,
        emailTokenVersion: undefined,
        facebookId: undefined,
        googleId: undefined,
        password: undefined,
        resetPasswordTokenVersion: undefined,
        updatedAt: undefined,
        updatedEmailTokenVersion: undefined,
      },
      adminId: undefined,
      updatedAt: undefined,
      user: {
        ...user.toJSON(),
        currentProfilePicture,
      },
      userId: undefined,
    };
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      blackList: returnedBlackList,
    },
  });
};
