import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import accEnv from '@src/helpers/accEnv';
import {
  sendUpdateEmailMessage,
} from '@src/helpers/email';
import {
  validateSendUpdateEmailSchema,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

const SEND_EMAIL_SECRET = accEnv('SEND_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const { user } = res.locals;
  const { error } = validateSendUpdateEmailSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  try {
    const passwordMatch = await compare(req.body.password, user.password);
    if (!passwordMatch) {
      return res.status(400).send({
        errors: {
          password: 'wrong password',
        },
      });
    }
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
    return res.status(500).send(err);
  }
  return res.status(200).send('ok');
};
