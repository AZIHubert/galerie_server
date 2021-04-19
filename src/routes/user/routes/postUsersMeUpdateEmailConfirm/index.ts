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
} from '@src/helpers/errorMessages';
import {
  validatesendUpdateNewEmailSchema,
  normalizeJoiErrors,
} from '@src/helpers/schemas';
import { sendEmailToken } from '@src/helpers/verifyConfirmation';

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  if (user.facebookId || user.googleId) {
    // use switch instead switch
    // user may be logged in with other Social Media
    // in the futur.
    const socialMedia = user.facebookId ? 'facebook' : 'google';

    return res.status(400).send({
      errors: `you can't modify your email if you are logged with ${socialMedia}.`,
    });
  }
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
  const { error, value } = validatesendUpdateNewEmailSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  const { password } = req.body;
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
  if (user.email === value.email) {
    return res.status(400).send({
      errors: {
        email: 'should be a different one',
      },
    });
  }
  try {
    if (req.body.resend) {
      await user.increment({ updatedEmailTokenVersion: 1 });
    }
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
        if (emailToken) sendValidateEmailMessage(req.body.email, emailToken);
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
