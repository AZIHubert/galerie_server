import { Request, Response, NextFunction } from 'express';

import User from '@src/db/models/user';

import { NOT_ADMIN } from '@src/helpers/errorMessages';

export default (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.user as User;
  if (role !== 'admin' && role !== 'superAdmin') {
    return res.status(401).send({
      errors: NOT_ADMIN,
    });
  }
  return next();
};
