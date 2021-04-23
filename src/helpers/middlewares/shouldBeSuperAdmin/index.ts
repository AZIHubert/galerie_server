import {
  NextFunction,
  Request,
  Response,
} from 'express';

import User from '@src/db/models/user';

import {
  NOT_SUPER_ADMIN,
} from '@src/helpers/errorMessages';

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = req.user as User;
  if (role !== 'superAdmin') {
    return res.status(401).send({
      errors: NOT_SUPER_ADMIN,
    });
  }
  return next();
};
