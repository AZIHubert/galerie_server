import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { sendConfirmAccount } from '@src/helpers/email';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

export default async (req: Request, res: Response) => {
  const { id } = req.body;
  if (!id) {
    return res.status(401).send({
      errors: 'user id is required',
    });
  }
  let user: User | null;
  try {
    user = await User.findByPk(id);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(401).send({
      errors: 'user not found',
    });
  }
  if (user.confirmed) {
    return res.status(401).send({
      errors: 'your account is already confirmed',
    });
  }
  try {
    await user.increment({ confirmTokenVersion: 1 });
  } catch (err) {
    res.status(500).send(err);
  }
  sign(
    {
      id,
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

  return res.status(200).send(user);
  // TODO:
  // need to send email
};
