import { Request, Response } from 'express';

import { BlackList, User } from '@src/db/models';
import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import {
  validateBlackListUser,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { id: userId, role } = req.user as User;
  const { id } = req.params;
  if (id === userId) {
    return res.status(401).send({
      errors: 'you can\'t put your account on the black list',
    });
  }
  let user: User | null;
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
  if (user.role === 'superAdmin') {
    return res.status(401).send({
      errors: 'you can black listed a super admin',
    });
  }
  if (role === 'admin' && user.role === 'admin') {
    return res.status(401).send({
      errors: 'you can black listed an admin',
    });
  }
  if (user.blackListId) {
    try {
      await BlackList.destroy({
        where: {
          id: user.blackListId,
        },
      });
      await user.update({ blackListId: null });
      return res.status(204).end();
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  const { error } = validateBlackListUser(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  try {
    const { id: blackListId } = await BlackList.create({
      adminId: userId,
      reason: req.body.reason,
      time: req.body.time ? req.body.time : null,
    });
    await user.update({ blackListId, role: 'user' });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
