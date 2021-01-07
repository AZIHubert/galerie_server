import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';

const ACCES_SECRET = accEnv('ACCES_SECRET');

export const shouldBeAuth = async (req: Request, res: Response, next: Function) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({
      errors: 'not authenticated',
    });
  }
  const token = authorization.split(' ')[1];
  let user: User | null;
  try {
    const { id } = verify(token, ACCES_SECRET) as {
      id: string;
    };
    user = await User.findByPk(id, { raw: true });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }
  res.locals.user = user;
  return next();
};

export const shouldBeConfirmed = async (__: Request, res: Response, next: Function) => {
  const { user: { confirmed } } = res.locals;
  if (!confirmed) {
    return res.status(401).send({
      errors: 'You\'re account need to be confimed',
    });
  }
  return next();
};

export const shouldNotBeAuth = (req: Request, res: Response, next: Function) => {
  const { authorization } = req.headers;
  if (authorization) {
    return res.status(401).send({
      errors: 'you are already authenticated',
    });
  }
  return next();
};
