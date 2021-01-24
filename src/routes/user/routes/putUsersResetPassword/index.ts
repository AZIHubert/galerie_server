import { hash } from 'bcrypt';
import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { ValidationError } from 'joi';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import checkBlackList from '@src/helpers/checkBlackList';
import {
  TOKEN_NOT_FOUND,
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
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
      errors: TOKEN_NOT_FOUND,
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(400).send({
      errors: WRONG_TOKEN,
    });
  }
  let tokenVerified: any;
  try {
    tokenVerified = verify(
      token,
      RESET_PASSWORD_SECRET,
    ) as {
      id: string;
      resetPasswordTokenVersion: number
    };
  } catch (err) {
    return res.status(500).send(err);
  }
  const { id } = tokenVerified;
  let user: User | null;
  try {
    user = await User.findOne({
      where: {
        id,
        googleId: null,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
    });
  }
  const isBlackListed = await checkBlackList(user);
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }
  const { resetPasswordTokenVersion } = tokenVerified;
  if (resetPasswordTokenVersion !== user.resetPasswordTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
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
    const hashedPassword = await hash(req.body.password, saltRounds);
    await user.increment({
      authTokenVersion: 1,
      resetPasswordTokenVersion: 1,
    });
    await user.update({ password: hashedPassword });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
