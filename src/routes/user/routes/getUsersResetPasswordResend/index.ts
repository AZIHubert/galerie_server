import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { sendResetPassword } from '@src/helpers/email';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');

export default async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(401).send({
      errors: 'email is required',
    });
  }
  let user: User | null;
  try {
    user = await User.findOne({ where: { email } });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }
  try {
    await user.increment({ resetPasswordTokenVersion: 1 });
  } catch (err) {
    return res.status(500).send(err);
  }
  sign(
    {
      id: user.id,
      resetPasswordTokenVersion: user.resetPasswordTokenVersion,
    },
    RESET_PASSWORD_SECRET,
    {
      expiresIn: '30m',
    },
    (err, emailToken) => {
      if (err) throw new Error(`something went wrong: ${err}`);
      if (emailToken) sendResetPassword(email, emailToken);
    },
  );
  return res.end();
};
