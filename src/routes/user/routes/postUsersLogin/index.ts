import { compare } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  NOT_CONFIRMED,
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';
import {
  validateLogIn,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  let user: User | null;

  // Check if request.body is valid.
  const {
    error,
    value,
  } = validateLogIn(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Find user with userName === userNameOrEmail
  // or email === userNameOrEmail.
  // This user cannot be register
  // with Facebook or Google.
  const {
    password,
    userNameOrEmail,
  } = value;
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
        userNameOrEmail: USER_NOT_FOUND,
      },
    });
  }

  // If user is not confirmed,
  // it cannot logged in.
  if (!user.confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }

  // Check if user is black listed.
  const isBlackListed = await checkBlackList(user);
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }

  // Check if password is correct.
  const PasswordsMatch = await compare(password, user.password);
  if (!PasswordsMatch) {
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
