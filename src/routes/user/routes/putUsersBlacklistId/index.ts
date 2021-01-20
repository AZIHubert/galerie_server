import { Request, Response } from 'express';

import User from '@src/db/models/user';
import { USER_NOT_FOUND } from '@src/helpers/errorMessages';

export default async (req: Request, res: Response) => {
  const { user: { id: userId, role } } = res.locals;
  const { id } = req.params;
  if (id === userId) {
    return res.status(401).send({
      errors: 'you can\'t put your account on the black list',
    });
  }
  let user: User | null;
  try {
    user = await User.findByPk(id);
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
  if (user.blackListed) {
    try {
      await user.update({ blackListed: false });
      return res.status(204).end();
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  try {
    await user.update({ blackListed: true, role: 'user' });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};

// TODO:
// create a blacklist model
// => userId
// => adminId
// => date (when user was blacklisted)
// => reason (string 200 char to explain why this user was baned)
// => time (how long a user is baned)
// HasOne user
//
// user
// remove blackListed
// add foreign key nullable blackListId
// user belongsTo blackList
//
// When logged in, and blackListed, check time
// if Date.now() > date + time
// delete blackListId
