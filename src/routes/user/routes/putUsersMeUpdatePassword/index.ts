import { compare, hash } from 'bcrypt';
import { Request, Response } from 'express';

import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from '@src/helpers/auth';
import {
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import saltRounds from '@src/helpers/saltRounds';
import {
  validateSendUpdatePassword,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  try {
    const { error } = validateSendUpdatePassword(req.body);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  const { password, updatedPassword } = req.body;
  const { user } = res.locals;
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
  try {
    const hashedPassword = await hash(updatedPassword, saltRounds);
    await user.update({ password: hashedPassword });
    await user.increment({ authTokenVersion: 1 });
  } catch (err) {
    return res.status(500).send(err);
  }
  sendRefreshToken(res, createRefreshToken(user));
  return res
    .status(200)
    .send({ accessToken: createAccessToken(user) });
};
