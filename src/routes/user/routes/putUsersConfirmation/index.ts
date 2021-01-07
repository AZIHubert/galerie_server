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
  try {
    const { id } = verify(
      token,
      CONFIRM_SECRET,
    ) as { id: string; };
    const user = await User.findOne({ where: { id } });
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
    await User.update({ confirmed: true }, { where: { id } });
    sendRefreshToken(res, createRefreshToken(user));
    return res
      .status(200)
      .send({ accessToken: createAccessToken(user) });
  } catch (err) {
    return res.status(500).send(err);
  }
};
