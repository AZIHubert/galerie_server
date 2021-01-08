import { Request, Response } from 'express';
import { sign, verify } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  sendValidateEmailMessage,
} from '@src/helpers/email';
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
      errors: 'confirmation token not found',
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: 'wrong token',
    });
  }
  let user: User | null;
  try {
    const { id, emailTokenVersion } = verify(
      token,
      SEND_EMAIL_SECRET,
    ) as {
      id: string;
      emailTokenVersion: number;
    };
    user = await User.findByPk(id);
    if (!user) {
      return res.status(404).send({
        errors: 'user not found',
      });
    }
    if (emailTokenVersion !== user.emailTokenVersion) {
      return res.status(401).send({
        errors: 'incorrect token version',
      });
    }
    if (user.email === req.body.email) {
      return res.status(400).send({
        errors: {
          email: 'should be a different one',
        },
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  const { error } = validatesendUpdateNewEmailSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  try {
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
