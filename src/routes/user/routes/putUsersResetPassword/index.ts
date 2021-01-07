import { hash } from 'bcrypt';
import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { ValidationError } from 'joi';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import saltRounds from '@src/helpers/saltRounds';
import {
  normalizeJoiErrors,
  validateModifyPasswordSchema,
} from '@root/src/helpers/schemas';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');

export default async (req: Request, res: Response) => {
  const { confirmation } = req.headers;
  if (confirmation) {
    const confirmationToken = (<string>confirmation).split(' ')[1];
    if (confirmationToken) {
      let token: any;
      try {
        token = verify(
          confirmationToken,
          RESET_PASSWORD_SECRET,
        ) as object;
      } catch (err) {
        return res.status(500).send(err);
      }
      const { id } = token;
      let error: ValidationError | undefined;
      try {
        const validation = validateModifyPasswordSchema(req.body);
        error = validation.error;
      } catch (err) {
        return res.status(500).send(err);
      }
      if (error) {
        return res.status(400).send({
          errors: normalizeJoiErrors(error),
        });
      }
      try {
        const user = await User.findByPk(id);
        if (!user) {
          return res.status(404).send({
            errors: 'user not found',
          });
        }
        const hashPassword = await hash(req.body.password, saltRounds);
        await user.increment({ tokenVersion: 1 });
        await user.update({ password: hashPassword });
        return res.status(204).end();
      } catch (err) {
        return res.status(500).send(err);
      }
    }
    return res.status(400).send({ errors: 'wrong token' });
  }
  return res.status(400).send({ errors: 'confirmation token not found' });
};
