import {
  Request,
  Response,
} from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  sendUpdateEmailMessage,
} from '@src/helpers/email';
import {
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePostUsersMeUpdateEmailBody,
} from '@src/helpers/schemas';
import validatePassword from '@src/helpers/validatePassword';

const SEND_EMAIL_SECRET = accEnv('SEND_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const user = req.user as User;

  // Validate req.body fields.
  const {
    error,
    value,
  } = validatePostUsersMeUpdateEmailBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Check if password match.
  const passwordIsValid = validatePassword(value.password, user.hash, user.salt);
  if (!passwordIsValid) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }

  // Send an email with a JWT signed token.
  try {
    await user.increment({ emailTokenVersion: 1 });
    sign(
      {
        emailTokenVersion: user.emailTokenVersion,
        id: user.id,
      },
      SEND_EMAIL_SECRET,
      {
        expiresIn: '30m',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) {
          sendUpdateEmailMessage(user.email, emailToken);
        }
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).send();
};
