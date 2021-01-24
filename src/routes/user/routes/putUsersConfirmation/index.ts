import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
// import {
//   createAccessToken,
//   createRefreshToken,
//   sendRefreshToken,
// } from '@src/helpers/auth';
import {
  ALREADY_CONFIRMED,
  TOKEN_NOT_FOUND,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

export default async (req: Request, res: Response, next: NextFunction) => {
  const { confirmation } = req.headers;
  if (!confirmation) {
    return res.status(401).send({
      errors: TOKEN_NOT_FOUND,
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }
  let user: User | null;
  let id: string;
  let confirmTokenVersion: number;
  try {
    const tokenVerified = verify(
      token,
      CONFIRM_SECRET,
    ) as {
      id: string;
      confirmTokenVersion: number
    };
    id = tokenVerified.id;
    confirmTokenVersion = tokenVerified.confirmTokenVersion;
    user = await User.findOne({
      where: {
        id,
        googleId: null,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  if (user.confirmed) {
    return res.status(401).send({
      errors: ALREADY_CONFIRMED,
    });
  }
  if (user.confirmTokenVersion !== confirmTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
  try {
    await user.increment({ confirmTokenVersion: 1 });
    await user.update({ confirmed: true }, { where: { id } });
  } catch (err) {
    res.status(500).send(err);
  }
  req.user = user;
  req.body = {
    userNameOrEmail: user.userName,
    password: user.password,
  };
  return next();
};
