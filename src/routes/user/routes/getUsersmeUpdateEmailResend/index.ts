import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import { User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import { sendUpdateEmailMessage } from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';

const SEND_EMAIL_SECRET = accEnv('SEND_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).send({
      errors: FIELD_IS_REQUIRED,
    });
  }
  let passwordsMatch: boolean;
  const user = req.user as User;
  try {
    passwordsMatch = await compare(req.body.password, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!passwordsMatch) {
    return res.status(400).send({
      errors: WRONG_PASSWORD,
    });
  }
  try {
    await user.increment({ emailTokenVersion: 1 });
    sign(
      {
        id: user.id,
        emailTokenVersion: user.emailTokenVersion,
      },
      SEND_EMAIL_SECRET,
      {
        expiresIn: '30m',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) {
          sendUpdateEmailMessage(user.email, 'emailToken');
        }
      },
    );
  } catch (err) {
    res.status(500).send(err);
  }
  return res.status(201).end();
};
