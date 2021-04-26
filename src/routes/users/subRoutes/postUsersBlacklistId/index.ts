import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';
import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePostUsersBlacklistIdBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    id: userId,
    role,
  } = req.user as User;
  let existingBlackList: BlackList | null;
  let blackList = {};
  let user: User | null;

  // You cannot black list yourself.
  if (id === userId) {
    return res.status(401).send({
      errors: 'you can\'t put your account on the black list',
    });
  }

  // Check if user exist and confirmed.
  try {
    user = await User.findOne({
      where: {
        id,
        confirmed: true,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
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
  if (role === 'admin' && user.role === 'admin') {
    return res.status(401).send({
      errors: 'you can\'t black listed an admin',
    });
  }

  // Check if user is already blackListed.
  try {
    existingBlackList = await BlackList.findOne({
      where: {
        userId: id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (existingBlackList) {
    try {
      return res.status(400).send({
        errors: 'user is already black listed',
      });
    } catch (err) {
      return res.status(500).send(err);
    }
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
    await user.update({ role: 'user' });
    const newBlackList = await BlackList.create({
      adminId: userId,
      reason: value.reason,
      time: value.time ? value.time : null,
      userId: id,
    });
    blackList = {
      ...newBlackList.toJSON(),
      updatedAt: undefined,
    };
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      blackList,
    },
  });
};
