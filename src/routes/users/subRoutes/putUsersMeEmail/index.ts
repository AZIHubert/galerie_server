// PUT /users/me/email/

import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import {
  FIELD_IS_ALREADY_TAKEN,
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
import validatePassword from '@src/helpers/validatePassword';
import { updateEmailToken } from '@src/helpers/verifyConfirmation';

export default async (req: Request, res: Response) => {
  const user = req.user as User;

  // Validate request.headers.confirmation.
  const verify = updateEmailToken(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }
  // Don't increment tokenVersion
  // it is not a error if an other
  // user is logged in when clicking
  // on the email.
  if (verify.id !== user.id) {
    return res.status(401).send({
      errors: WRONG_TOKEN_USER_ID,
    });
  }
  if (verify.updatedEmailTokenVersion !== user.updatedEmailTokenVersion) {
    // If issue with confirmation
    // increment tokenVersion.
    try {
      await user.increment({
        authTokenVersion: 1,
        updatedEmailTokenVersion: 1,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }

  // validate request.headers.confirmation.email
  const {
    error: tokenError,
    value: tokenValue,
  } = validatePutUsersMeEmailConfirmToken({
    email: verify.updatedEmail,
  });
  if (tokenError) {
    // If issue with confirmation
    // increment tokenVersion.
    try {
      await user.increment({
        authTokenVersion: 1,
        updatedEmailTokenVersion: 1,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(401).send({
      errors: normalizeJoiErrors(tokenError).email,
    });
  }
  if (verify.updatedEmail === user.email) {
    // If issue with confirmation
    // increment tokenVersion.
    try {
      await user.increment({
        authTokenVersion: 1,
        updatedEmailTokenVersion: 1,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(401).send({
      errors: `${WRONG_TOKEN}: email should be different`,
    });
  }

  // Check if confirmation.email
  // is not already taken.
  try {
    const emailAlreadyUse = await User.findOne({
      where: {
        email: tokenValue.email,
      },
    });
    if (emailAlreadyUse) {
      await user.increment({
        authTokenVersion: 1,
        updatedEmailTokenVersion: 1,
      });
      return res.status(401).send({
        errors: `${WRONG_TOKEN}: ${FIELD_IS_ALREADY_TAKEN}`,
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePutUsersMeEmailBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Validate password.
  const passwordIsValid = validatePassword(value.password, user.hash, user.salt);
  if (!passwordIsValid) {
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
    data: {
      expiresIn: jwt.expires,
      token: jwt.token,
    },
  });
};
