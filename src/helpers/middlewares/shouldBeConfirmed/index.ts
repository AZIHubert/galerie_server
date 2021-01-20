import { Request, Response, NextFunction } from 'express';

import {
  NOT_CONFIRMED,
} from '@src/helpers/errorMessages';

export default async (__: Request, res: Response, next: NextFunction) => {
  const { user: { confirmed } } = res.locals;
  if (!confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }
  return next();
};
