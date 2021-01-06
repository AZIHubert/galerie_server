import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';

const ACCES_SECRET = accEnv('ACCES_SECRET');

export const shouldBeAuth = (req: Request, res: Response, next: Function) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).send({
      errors: 'not authenticated',
    });
  }
  try {
    const token = authorization.split(' ')[1];
    const payload = verify(token, ACCES_SECRET);
    res.locals.payload = payload;
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      errors: err,
    });
  }
  return next();
};

export const shouldBeConfirmed = async (__: Request, res: Response, next: Function) => {
  try {
    const user = await User.findByPk(res.locals.payload.id, { raw: true });
    if (user && !user.confirmed) {
      return res.status(401).send({
        errors: 'You\'re account need to be confimed',
      });
    }
    res.locals.user = user;
    return next();
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      errors: err,
    });
  }
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
