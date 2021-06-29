// POST /users/password/

import {
  Request,
  Response,
} from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '#src/db/models';

import accEnv from '#src/helpers/accEnv';
import { sendResetPassword } from '#src/helpers/email';
import checkBlackList from '#src/helpers/checkBlackList';
import {
  DEFAULT_ERROR_MESSAGE,
  MODEL_NOT_FOUND,
  USER_SHOULD_BE_CONFIRMED,
  USER_SHOULD_NOT_BE_BLACK_LISTED,
} from '#src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePostUsersResetPasswordBody,
} from '#src/helpers/schemas';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');

export default async (req: Request, res: Response) => {
  let isBlackListed: boolean;
  let user: User | null;

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostUsersResetPasswordBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Fetch user with request.email.
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

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: {
        email: MODEL_NOT_FOUND('user'),
      },
    });
  }

  // Not confirmed users cannot reset
  // their password.
  if (!user.confirmed) {
    return res.status(401).send({
      errors: USER_SHOULD_BE_CONFIRMED,
    });
  }

  // Black listed users cannot reset
  // their password
  try {
    isBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_SHOULD_NOT_BE_BLACK_LISTED,
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
        if (err) throw new Error(`${DEFAULT_ERROR_MESSAGE}: ${err}`);
        if (emailToken) sendResetPassword(value.email, emailToken);
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
