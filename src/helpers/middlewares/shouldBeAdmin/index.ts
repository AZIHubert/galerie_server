import { Request, Response, NextFunction } from 'express';

import {
  NOT_SUPER_ADMIN,
} from '@src/helpers/errorMessages';

export default (_req: Request, res: Response, next: NextFunction) => {
  const { user: { role } } = res.locals;
  if (role !== 'admin' && role !== 'superAdmin') {
    return res.status(401).send({
      errors: NOT_SUPER_ADMIN,
    });
  }
  return next();
};
