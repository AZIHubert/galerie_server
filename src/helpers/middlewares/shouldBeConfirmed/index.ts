import { Request, Response, NextFunction } from 'express';

import User from '@src/db/models/user';

import {
  NOT_CONFIRMED,
} from '@src/helpers/errorMessages';

export default async (req: Request, res: Response, next: NextFunction) => {
  const { confirmed } = req.user as User;
  if (!confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }
  return next();
};
