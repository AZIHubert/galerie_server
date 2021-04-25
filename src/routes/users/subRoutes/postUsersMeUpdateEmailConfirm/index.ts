import { compare } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  sendValidateEmailMessage,
} from '@src/helpers/email';
import {
  WRONG_PASSWORD,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import {
  validatesendUpdateNewEmailSchema,
  normalizeJoiErrors,
} from '@src/helpers/schemas';
import { sendEmailToken } from '@src/helpers/verifyConfirmation';

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

// TODO:
// Change route by /users/me/email/confirm

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  const { password } = req.body;

  // Check if JWT token is valid.
  const verify = sendEmailToken(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }
  if (verify.id !== user.id) {
    return res.status(401).send({
      errors: WRONG_TOKEN_USER_ID,
    });
  }
  if (verify.emailTokenVersion !== user.emailTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }

  // Check if request.body fields are valids.
  const {
    error,
    value,
  } = validatesendUpdateNewEmailSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Check if password match.
  let passwordsMatch: boolean;
  try {
    passwordsMatch = await compare(password, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!passwordsMatch) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }

  // New email can't be the same as the old one.
  if (user.email === value.email) {
    return res.status(400).send({
      errors: {
        email: 'should be a different one',
      },
    });
  }

  // Send an email to the new registered email
  // with a signed JWT token.
  try {
    await user.increment({
      // This route is accessible when clicking
      // on a link send by email.
      // emailTokenVersion allow us to verify
      // that this link should not be
      // accessible once again.
      emailTokenVersion: 1,
      updatedEmailTokenVersion: 1,
    });
    sign(
      {
        id: user.id,
        updatedEmail: value.email,
        updatedEmailTokenVersion: user.updatedEmailTokenVersion,
      },
      UPDATE_EMAIL_SECRET,
      {
        expiresIn: '2d',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) sendValidateEmailMessage(value.email, emailToken);
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
