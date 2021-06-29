import {
  NextFunction,
  Request,
  Response,
} from 'express';

import User from '#src/db/models/user';

import { USER_SHOULD_NOT_BE_REGISTERED_WITH_A_SOCIAL_MEDIA } from '#src/helpers/errorMessages';

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    facebookId,
    googleId,
  } = req.user as User;
  if (googleId || facebookId) {
    return res.status(401).send({
      errors: USER_SHOULD_NOT_BE_REGISTERED_WITH_A_SOCIAL_MEDIA,
    });
  }
  return next();
};
