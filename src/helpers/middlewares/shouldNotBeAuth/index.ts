import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { USER_SHOULD_NOT_BE_AUTHENTICATED } from '@src/helpers/errorMessages';

export default (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.isAuthenticated()) {
    return res.status(401).send({
      errors: USER_SHOULD_NOT_BE_AUTHENTICATED,
    });
  }
  return next();
};
