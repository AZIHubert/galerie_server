import { hash } from 'bcrypt';
import { Request, Response } from 'express';
import { ValidationError } from 'joi';

import User from '@src/db/models/user';
import checkBlackList from '@src/helpers/checkBlackList';
import {
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import saltRounds from '@src/helpers/saltRounds';
import {
  normalizeJoiErrors,
  validateModifyPasswordSchema,
} from '@src/helpers/schemas';
import { resetPassword } from '@src/helpers/verifyConfirmation';

export default async (req: Request, res: Response) => {
  const verify = resetPassword(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }
  const { resetPasswordTokenVersion, id } = verify;
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
