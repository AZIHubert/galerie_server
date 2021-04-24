import {
  Request,
  Response,
} from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

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
  let user: User | null;

  const {
    error,
    value,
  } = validateResetPasswordSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Find user with request.email.
  // Facebook/Google registered users
  // doesn't have a password,
  // they're not included in the request.
  try {
    user = await User.findOne({
      where: {
        email: value.email,
        facebookId: null,
        googleId: null,
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

  // Not confirmed users cannot reset
  // their password.
  if (!user.confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }

  // Black listed users cannot reset
  // their password
  const isBlackListed = await checkBlackList(user);
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }

  // Send an email to the user's email
  // with a signed JWT token.
  try {
    await user.increment({
      resetPasswordTokenVersion: 1,
    });
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
        if (emailToken) sendResetPassword(value.email, emailToken);
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
