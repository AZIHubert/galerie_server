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
  if (!confirmation) {
    return res.status(400).send({
      errors: 'confirmation token not found',
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(400).send({ errors: 'wrong token' });
  }
  let tokenVerified: any;
  try {
    tokenVerified = verify(
      token,
      RESET_PASSWORD_SECRET,
    ) as {
      id: string;
    };
  } catch (err) {
    return res.status(500).send(err);
  }
  const { id } = tokenVerified;
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
  let user: User | null;
  try {
    user = await User.findByPk(id);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }
  try {
    const hashedPassword = await hash(req.body.password, saltRounds);
    await user.increment({ tokenVersion: 1 });
    await user.update({ password: hashedPassword });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
