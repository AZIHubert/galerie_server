import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from '@src/helpers/auth';
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';

const REFRESH_SECRET = accEnv('REFRESH_SECRET');

export default async (req: Request, res: Response) => {
  const token = req.cookies.jid;
  if (!token) {
    return res.status(401).send({
      ok: false,
      accessToken: '',
    });
  }
  let payload: any = null;
  try {
    payload = verify(token, REFRESH_SECRET);
  } catch (err) {
    return res.status(500).send(err);
  }
  const user = await User.findByPk(payload.id, { raw: true });
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  if (user.authTokenVersion !== payload.authTokenVersion) {
    return res.status(401).send({
      ok: false,
      accessToken: '',
    });
  }
  sendRefreshToken(res, createRefreshToken(user));
  return res
    .status(200)
    .send({
      ok: true,
      accessToken: createAccessToken(user),
    });
};
