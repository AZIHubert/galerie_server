import {
  NextFunction,
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  USER_SHOULD_NOT_BE_BLACK_LISTED,
  USER_SHOULD_BE_AUTHENTICATED,
} from '@src/helpers/errorMessages';

export default async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const currentUser = req.user as User;
  let isBlackListed: boolean;
  if (!req.isAuthenticated()) {
    return res.status(401).send({
      errors: USER_SHOULD_BE_AUTHENTICATED,
    });
  }
  try {
    isBlackListed = await checkBlackList(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (isBlackListed) {
    req.logOut();
    return res.status(401).send({
      errors: USER_SHOULD_NOT_BE_BLACK_LISTED,
    });
  }
  return next();
};
