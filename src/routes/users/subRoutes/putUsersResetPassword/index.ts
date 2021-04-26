import { hash } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  NOT_CONFIRMED,
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
  let isBlackListed: boolean;
  let user: User | null;

  // Check if confirmToken is valid.
  const verify = resetPassword(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }

  // Check if user exist and
  // not register throught Facebook or Google.
  try {
    user = await User.findOne({
      where: {
        id: verify.id,
        facebookId: null,
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

  // Not confirmed users cannot reset
  // their password.
  if (!user.confirmed) {
    return res.status(400).send({
      errors: NOT_CONFIRMED,
    });
  }

  // Check if user is not blacklisted.
  try {
    isBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (isBlackListed) {
    return res.status(400).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }

  // Check if is correct token version.
  if (verify.resetPasswordTokenVersion !== user.resetPasswordTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
  const { error } = validateModifyPasswordSchema(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    await user.increment({
      // authTokenVersion allow us to let
      // a user access his account.
      // Incrementing authTokenVersion allow
      // use to block all other account logged
      // in other device that the one the user
      // use to update his email.
      authTokenVersion: 1,
      // This route is accessible when clicking
      // on a link send by email.
      // Incrementing resetPasswordTokenVersion
      // allow us to verify that this link
      // should not be accessible once again.
      resetPasswordTokenVersion: 1,
    });
    const hashedPassword = await hash(req.body.password, saltRounds);
    await user.update({ password: hashedPassword });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(204).end();
};
