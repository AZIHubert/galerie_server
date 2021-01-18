import { Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';

import accEnv from '@src/helpers/accEnv';
import {
  sendValidateEmailMessage,
} from '@src/helpers/email';
import {
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import {
  validatesendUpdateNewEmailSchema,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

const SEND_EMAIL_SECRET = accEnv('SEND_EMAIL_SECRET');
const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const { confirmation } = req.headers;
  if (!confirmation) {
    return res.status(401).send({
      errors: TOKEN_NOT_FOUND,
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }
  let id: string;
  let emailTokenVersion: number;
  try {
    const verifiedToken = verify(
      token,
      SEND_EMAIL_SECRET,
    ) as {
      id: string;
      emailTokenVersion: number;
    };
    id = verifiedToken.id;
    emailTokenVersion = verifiedToken.emailTokenVersion;
  } catch (err) {
    return res.status(500).send(err);
  }
  const { user } = res.locals;
  if (id !== user.id) {
    return res.status(401).send({
      errors: WRONG_TOKEN_USER_ID,
    });
  }
  if (emailTokenVersion !== user.emailTokenVersion) {
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
