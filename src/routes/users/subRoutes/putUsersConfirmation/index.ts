import { Request, Response } from 'express';

import { User } from '@src/db/models';

import {
  MODEL_NOT_FOUND,
  USER_SHOULD_NOT_BE_CONFIRMED,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';
import { confirmUser } from '@src/helpers/verifyConfirmation';

export default async (req: Request, res: Response) => {
  let user: User | null;

  // Check if confirm token is valid.
  const verify = confirmUser(req);
  if (!verify.OK) {
    return res.status(verify.status).send({
      errors: verify.errors,
    });
  }
  try {
    user = await User.findOne({
      where: {
        facebookId: null,
        googleId: null,
        id: verify.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }
  if (user.confirmTokenVersion !== verify.confirmTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }

  // Check if user is not already confirmed.
  if (user.confirmed) {
    return res.status(401).send({
      errors: USER_SHOULD_NOT_BE_CONFIRMED,
    });
  }

  try {
    // Increment confirmTokenVersion user's field.
    // This route is accessible when clicking
    // on a link send by email.
    // confirmTokenVersion allow us to verify
    // that this link should not be
    // accessible once again.
    await user.increment({ confirmTokenVersion: 1 });
    await user.update({ confirmed: true });
  } catch (err) {
    res.status(500).send(err);
  }

  // After a user confirm his account,
  // he should access the app immediately
  // without having to log in.
  const jwt = signAuthToken(user);
  setRefreshToken(req, user);
  return res.status(200).send({
    expiresIn: jwt.expires,
    token: jwt.token,
  });
};
