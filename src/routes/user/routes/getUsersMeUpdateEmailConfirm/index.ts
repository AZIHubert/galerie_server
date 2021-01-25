import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  sendValidateEmailMessage,
} from '@src/helpers/email';
import {
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import {
  validatesendUpdateNewEmailSchema,
  normalizeJoiErrors,
} from '@src/helpers/schemas';
import { sendEmailToken } from '@src/helpers/verifyConfirmation';

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const verify = sendEmailToken(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }
  const user = req.user as User;
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
  if (user.email === req.body.email) {
    return res.status(400).send({
      errors: {
        email: 'should be a different one',
      },
    });
  }
  const { error } = validatesendUpdateNewEmailSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  try {
    await user.increment({ emailTokenVersion: 1 });
    sign(
      {
        id: user.id,
        updatedEmail: req.body.email,
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
