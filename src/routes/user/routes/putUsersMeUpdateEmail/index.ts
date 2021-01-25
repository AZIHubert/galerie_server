import { compare } from 'bcrypt';
import { Request, Response } from 'express';

import User from '@root/src/db/models/user';
import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import { updateEmailToken } from '@src/helpers/verifyConfirmation';

export default async (req: Request, res: Response) => {
  const verify = updateEmailToken(req);
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
  if (verify.updatedEmailTokenVersion !== user.updatedEmailTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
  if (!verify.updatedEmail) {
    return res.status(401).send({
      errors: 'updated email not found',
    });
  }
  const { password } = req.body;
  if (!password) {
    return res.status(400).send({
      errors: {
        password: FIELD_IS_REQUIRED,
      },
    });
  }
  let matchedPasswords: boolean;
  try {
    matchedPasswords = await compare(password, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!matchedPasswords) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }
  try {
    await user.update({ email: verify.updatedEmail });
    await user.increment({
      authTokenVersion: 1,
      updatedEmailTokenVersion: 1,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
