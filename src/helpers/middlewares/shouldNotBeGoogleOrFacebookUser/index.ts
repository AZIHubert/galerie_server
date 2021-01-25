import { Request, Response, NextFunction } from 'express';

import User from '@src/db/models/user';

export default async (req: Request, res: Response, next: NextFunction) => {
  const { googleId, facebookId } = req.user as User;
  if (googleId || facebookId) {
    return res.status(401).send({
      errors: 'you can\'t modify your account',
    });
  }
  return next();
};
