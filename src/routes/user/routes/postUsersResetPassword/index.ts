import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { sendResetPassword } from '@src/helpers/email';
import checkBlackList from '@src/helpers/checkBlackList';
import {
  NOT_CONFIRMED,
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validateResetPasswordSchema,
} from '@src/helpers/schemas';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');

export default async (req: Request, res: Response) => {
  const { error, value } = validateResetPasswordSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  const { email } = value;
  let user: User | null;
  try {
    user = await User.findOne({
      where: {
        email: value.email,
        googleId: null,
        facebookId: null,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: {
        email: USER_NOT_FOUND,
      },
    });
  }
  const isBlackListed = await checkBlackList(user);
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }
  if (!user.confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }
  try {
    if (req.body.resend) {
      await user.increment({ resetPasswordTokenVersion: 1 });
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
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
