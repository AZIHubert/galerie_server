import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import _ from 'lodash';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { sendResetPassword } from '@src/helpers/email';
import {
  normalizeJoiErrors,
  validateResetPasswordSchema,
} from '@src/helpers/schemas';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');

export default async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const { error } = validateResetPasswordSchema(req.body);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).send({
        errors: {
          email: 'user not found',
        },
      });
    }
    sign(
      {
        user: _.pick(user, 'id'),
      },
      RESET_PASSWORD_SECRET,
      {
        expiresIn: '2d',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) sendResetPassword(email, emailToken);
      },
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).end();
};
