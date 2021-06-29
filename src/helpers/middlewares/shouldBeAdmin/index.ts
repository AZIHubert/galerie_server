import {
  NextFunction,
  Request,
  Response,
} from 'express';

import User from '#src/db/models/user';

import { USER_SHOULD_BE_AN_ADMIN } from '#src/helpers/errorMessages';

export default (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { role } = req.user as User;
  if (role !== 'admin' && role !== 'superAdmin') {
    return res.status(401).send({
      errors: USER_SHOULD_BE_AN_ADMIN,
    });
  }
  return next();
};
