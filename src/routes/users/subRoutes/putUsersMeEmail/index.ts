import { compare } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import {
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  validatePutUsersMeEmailBody,
  validatePutUsersMeEmailConfirmToken,
  normalizeJoiErrors,
} from '@src/helpers/schemas';
import setRefreshToken from '@src/helpers/setRefreshToken';
import { updateEmailToken } from '@src/helpers/verifyConfirmation';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  let matchedPasswords: boolean;

  // Validate confirmToken.
  const verify = updateEmailToken(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }
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
  const {
    error: tokenError,
    value: tokenValue,
  } = validatePutUsersMeEmailConfirmToken({
    email: verify.updatedEmail,
  });
  if (tokenError) {
    return res.status(401).send({
      errors: normalizeJoiErrors(tokenError).email,
    });
  }
  if (verify.updatedEmail === user.email) {
    return res.status(401).send({
      errors: `${WRONG_TOKEN}: email should be different`,
    });
  }

  // Validate password.
  const {
    error,
    value,
  } = validatePutUsersMeEmailBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  try {
    matchedPasswords = await compare(value.password, user.password);
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
    await user.update({ email: tokenValue.email });
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
      // Incrementing updatedEmailTokenVersion
      // allow us to verify  that this link
      // should not be accessible once again.
      updatedEmailTokenVersion: 1,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Because authTokenVersion was incremented,
  // we need to resend authToken and refreshToken
  // to user keep his connection alive.
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({
    expiresIn: jwt.expires,
    token: jwt.token,
  });
};
