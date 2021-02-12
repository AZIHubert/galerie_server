import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { sendConfirmAccount } from '@src/helpers/email';
import {
  ALREADY_CONFIRMED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

export default async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).send({
      errors: 'user email is required',
    });
  }
  let user: User | null;
  try {
    user = await User.findOne({
      where: {
        email,
        googleId: null,
        facebookId: null,
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
    return res.status(400).send({
      errors: ALREADY_CONFIRMED,
    });
  }
  try {
    await user.increment({ confirmTokenVersion: 1 });
    sign(
      {
        id: user.id,
        confirmTokenVersion: user.confirmTokenVersion,
      },
      CONFIRM_SECRET,
      {
        expiresIn: '2d',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) sendConfirmAccount(user!.email, emailToken);
      },
    );
  } catch (err) {
    res.status(500).send(err);
  }
  return res.status(204).end();
};
