import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import { WRONG_PASSWORD } from '@src/helpers/errorMessages';
import genPassword from '@src/helpers/genPassword';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  normalizeJoiErrors,
  validatePutUsersMePasswordBody,
} from '@src/helpers/schemas';
import setRefreshToken from '@src/helpers/setRefreshToken';
import validatePassword from '@src/helpers/validatePassword';

export default async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user as User;

  // Validate request.body.
  try {
    const {
      error,
    } = validatePutUsersMePasswordBody(req.body);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if current password match.
  const passwordIsValid = validatePassword(currentPassword, user.hash, user.salt);
  if (!passwordIsValid) {
    return res.status(400).send({
      errors: {
        currentPassword: WRONG_PASSWORD,
      },
    });
  }

  try {
    // Hash and update password.
    const {
      hash,
      salt,
    } = genPassword(newPassword);
    await user.update({
      hash,
      salt,
    });
    // authTokenVersion allow us to let
    // a user access his account.
    // Incrementing authTokenVersion allow
    // use to block all other account logged
    // in other device that the one the user
    // use to update his email.
    await user.increment({ authTokenVersion: 1 });
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
