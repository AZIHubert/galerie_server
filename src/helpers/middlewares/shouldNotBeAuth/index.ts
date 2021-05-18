import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { USER_IS_LOGGED_IN } from '@src/helpers/errorMessages';

export default (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return res.status(401).send({
      errors: USER_IS_LOGGED_IN,
    });
  }
  return next();
};
