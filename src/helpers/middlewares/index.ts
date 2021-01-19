import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import multer from 'multer';

import User from '@src/db/models/user';
import accEnv from '../accEnv';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  NOT_SUPER_ADMIN,
  USER_IS_LOGGED_IN,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
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
  if (user.authTokenVersion !== authTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
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

export const shouldBeSuperAdmin = async (__: Request, res: Response, next: Function) => {
  const { user: { role } } = res.locals;
  if (role !== 'superAdmin') {
    return res.status(401).send({
      errors: NOT_SUPER_ADMIN,
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

export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }).single('image');

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.message === 'Unexpected field') {
        return res.status(400).send({
          errors: 'something went wrong with attached file',
        });
      }
      return res.status(500).send(err);
    } if (err) {
      return res.status(500).send(err);
    }
    return next();
  });
};
