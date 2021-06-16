import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import { sendConfirmAccount } from '@src/helpers/email';
import {
  MODEL_NOT_FOUND,
  USER_SHOULD_NOT_BE_CONFIRMED,
} from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePostUsersConfirmationBody,
} from '@src/helpers/schemas';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

export default async (req: Request, res: Response) => {
  let user: User | null;

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostUsersConfirmationBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Fetch user with email.
  // This user shouldn't be register throught
  // Facebook or Google.
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

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: {
        email: MODEL_NOT_FOUND('user'),
      },
    });
  }

  // Check if user is not already confirmed.
  if (user.confirmed) {
    return res.status(400).send({
      errors: USER_SHOULD_NOT_BE_CONFIRMED,
    });
  }

  try {
    // Increment confirmTokenVersion.
    // If a user try to use a sign token
    // with his confirmTokenVersion who not match
    // the current user confirmTokenVersion
    // (it append when a user resend the confirmation email
    // and not click on the link in the last email send),
    // it send an error.
    await user.increment({ confirmTokenVersion: 1 });

    // Sign a token and send an email with it.
    // This token contain the user id and his
    // current confirmTokenVersion.
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
