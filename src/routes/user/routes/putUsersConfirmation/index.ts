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
  try {
    const { confirmation } = req.headers;
    if (confirmation) {
      const confirmationToken = (<string>confirmation).split(' ')[1];
      if (confirmationToken) {
        const { user: { id } } = verify(
          confirmationToken,
          CONFIRM_SECRET,
        ) as {user: { id: string; }};
        const user = await User.findOne({ where: { id } });
        if (user) {
          if (!user.confirmed) {
            // If not, update his account end set a cookie for auth
            await User.update({ confirmed: true }, { where: { id } });

            // Create an access token for authentification
            sendRefreshToken(res, createRefreshToken(user));
            return res
              .status(200)
              .send({ accessToken: createAccessToken(user) });
          }
          return res.status(400).send({ errors: 'your account is already confirmed' });
        }
        return res.status(404).send({ errors: 'user does not exist' });
      }
      return res.status(400).send({ errors: 'wrong token' });
    }
    return res.status(400).send({ errors: 'confirmation token not found' });
  } catch (err) {
    return res.status(500).send(err);
  }
};
