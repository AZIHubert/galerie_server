import {
  NextFunction,
  Request,
  Response,
} from 'express';

import User from '@src/db/models/user';

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    facebookId,
    googleId,
  } = req.user as User;
  if (googleId || facebookId) {
    return res.status(401).send({
      // TODO:
      // Better error message.
      errors: 'you can\'t modify your account',
    });
  }
  return next();
};
