import {
  compare,
  hash,
} from 'bcrypt';
import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import { WRONG_PASSWORD } from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import saltRounds from '@src/helpers/saltRounds';
import {
  normalizeJoiErrors,
  validatePutUsersMePasswordBody,
} from '@src/helpers/schemas';
import setRefreshToken from '@src/helpers/setRefreshToken';

export default async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user as User;
  let passwordsMatch: boolean;

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
  try {
    passwordsMatch = await compare(currentPassword, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!passwordsMatch) {
    return res.status(400).send({
      errors: {
        currentPassword: WRONG_PASSWORD,
      },
    });
  }

  try {
    // Hash and update password.
    const hashedPassword = await hash(newPassword, saltRounds);
    await user.update({ password: hashedPassword });
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
    expiresIn: jwt.expires,
    token: jwt.token,
  });
};
