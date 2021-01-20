import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import checkBlackList from '@src/helpers/checkBlackList';
import {
  NOT_AUTHENTICATED,
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';

const ACCES_SECRET = accEnv('ACCES_SECRET');

export default async (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({
      errors: NOT_AUTHENTICATED,
    });
  }
  const token = authorization.split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }
  let user: User | null;
  let authTokenVersion: number;
  try {
    const verifiedToken = verify(token, ACCES_SECRET) as {
      id: string;
      authTokenVersion: number
    };
    authTokenVersion = verifiedToken.authTokenVersion;
    user = await User.findByPk(verifiedToken.id);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  const isBlackListed = await checkBlackList(user);
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }
  if (user.authTokenVersion !== authTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
  res.locals.user = user;
  return next();
};
