import { Request, Response } from 'express';

import { User } from '@src/db/models';
import {
  FIELD_IS_REQUIRED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!role) {
    return res.status(400).send({
      errors: FIELD_IS_REQUIRED,
    });
  }
  const currentUser = req.user as User;
  const { id: userId } = currentUser;
  if (id === userId) {
    return res.status(400).send({
      errors: 'you can\'t modify your role yourself',
    });
  }
  if (role === 'user') {
    return res.status(400).send({
      errors: 'role should not be user',
    });
  }
  if (role !== 'admin' && role !== 'superAdmin') {
    return res.status(400).send({
      errors: 'role should be admin or superAdmin',
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
    return res.status(400).send({
      errors: 'user is already a super admin',
    });
  }
  if (user.role === role) {
    try {
      await user.update({ role: 'user' });
      return res.status(204).end();
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  try {
    await user.update({ role });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
