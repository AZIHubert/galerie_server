// POST /users/login/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  MODEL_NOT_FOUND,
  WRONG_PASSWORD,
  USER_SHOULD_BE_CONFIRMED,
  USER_SHOULD_NOT_BE_BLACK_LISTED,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';
import {
  normalizeJoiErrors,
  validatePostUsersLoginBody,
} from '@src/helpers/schemas';
import validatePassword from '@src/helpers/validatePassword';

export default async (req: Request, res: Response) => {
  let user: User | null;
  let userIsBlackListed: boolean;

  // Check if request.body is valid.
  const {
    error,
    value,
  } = validatePostUsersLoginBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Fields from value are trimed.
  const {
    password,
    userNameOrEmail,
  } = value;

  // Find user with userName === userNameOrEmail
  // or email === userNameOrEmail.
  // This user cannot be register
  // with Facebook or Google.
  try {
    user = await User.findOne({
      where: {
        [Op.or]: [
          {
            userName: `@${userNameOrEmail}`,
          },
          {
            email: userNameOrEmail,
          },
        ],
        facebookId: null,
        googleId: null,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // This request doesn't try to find
  // confirmed, not black listed user,
  // because we want to send specific
  // error for each cases.
  if (!user) {
    return res.status(404).send({
      errors: {
        userNameOrEmail: MODEL_NOT_FOUND('user'),
      },
    });
  }

  // If user is not confirmed,
  // it cannot logged in.
  if (!user.confirmed) {
    return res.status(401).send({
      errors: USER_SHOULD_BE_CONFIRMED,
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (userIsBlackListed) {
    return res.status(400).send({
      errors: USER_SHOULD_NOT_BE_BLACK_LISTED,
    });
  }

  // Check if request.password is valid.
  const passwordIsValid = validatePassword(password, user.hash, user.salt);
  if (!passwordIsValid) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }

  // Create session and send auth Token.
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({
    expiresIn: jwt.expires,
    token: jwt.token,
  });
};
