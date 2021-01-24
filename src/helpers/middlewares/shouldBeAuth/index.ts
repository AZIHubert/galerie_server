import { Request, Response, NextFunction } from 'express';

import User from '@src/db/models/user';
import checkBlackList from '@src/helpers/checkBlackList';
import {
  NOT_AUTHENTICATED,
  USER_IS_BLACK_LISTED,
} from '@src/helpers/errorMessages';

export default async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send({
      errors: NOT_AUTHENTICATED,
    });
  }
  const currentUser = req.user as User;
  const isBlackListed = await checkBlackList(currentUser);
  if (isBlackListed) {
    req.logOut();
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }
  return next();
};
