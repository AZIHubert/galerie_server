import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from '@src/helpers/auth';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

export default async (req: Request, res: Response) => {
  const { confirmation } = req.headers;
  if (!confirmation) {
    return res.status(401).send({
      errors: 'token not found',
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: 'wrong token',
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
    user = await User.findByPk(id);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }
  if (user.confirmed) {
    return res.status(401).send({
      errors: 'your account is already confirmed',
    });
  }
  if (user.confirmTokenVersion !== confirmTokenVersion) {
    return res.status(401).send({
      errors: 'wrong token version',
    });
  }
  await User.update({ confirmed: true }, { where: { id } });
  sendRefreshToken(res, createRefreshToken(user));
  return res
    .status(200)
    .send({ accessToken: createAccessToken(user) });
};
