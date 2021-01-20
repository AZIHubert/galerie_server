import { Request, Response, NextFunction } from 'express';

import {
  USER_IS_LOGGED_IN,
} from '@src/helpers/errorMessages';

export default (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (authorization) {
    return res.status(401).send({
      errors: USER_IS_LOGGED_IN,
    });
  }
  return next();
};
