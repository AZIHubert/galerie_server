import { Response } from 'express';
import { sign } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';

const ACCES_SECRET = accEnv('ACCES_SECRET');
const REFRESH_SECRET = accEnv('REFRESH_SECRET');
const SECURE = accEnv('NODE_ENV') === 'production';

export const createAccessToken = (user: User) => sign(
  { id: user.id },
  ACCES_SECRET,
  { expiresIn: '15m' },
);

export const createRefreshToken = (user: User) => sign(
  {
    id: user.id,
    authTokenVersion: user.authTokenVersion,
  },
  REFRESH_SECRET,
  { expiresIn: '7d' },
);

export const sendRefreshToken = (res: Response, token: string) => res
  .cookie('jid', token, {
    httpOnly: true,
    secure: SECURE,
    path: '/users/refresh_token',
  });
