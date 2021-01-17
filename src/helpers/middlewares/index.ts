import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '../accEnv';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  USER_IS_LOGGED_IN,
  USER_NOT_FOUND,
  WRONG_TOKEN,
} from '../errorMessages';

const ACCES_SECRET = accEnv('ACCES_SECRET');

export const shouldBeAuth = async (req: Request, res: Response, next: Function) => {
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
  try {
    const { id } = verify(token, ACCES_SECRET) as {
      id: string;
    };
    user = await User.findByPk(id);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  res.locals.user = user;
  return next();
};

export const shouldBeConfirmed = async (__: Request, res: Response, next: Function) => {
  const { user: { confirmed } } = res.locals;
  if (!confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }
  return next();
};

export const shouldNotBeAuth = (req: Request, res: Response, next: Function) => {
  const { authorization } = req.headers;
  if (authorization) {
    return res.status(401).send({
      errors: USER_IS_LOGGED_IN,
    });
  }
  return next();
};
