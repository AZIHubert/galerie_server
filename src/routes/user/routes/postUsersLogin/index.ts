import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

import { User } from '@src/db/models';

import setRefreshToken from '@root/src/helpers/setRefreshToken';
import checkBlackList from '@src/helpers/checkBlackList';
import {
  NOT_CONFIRMED,
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  validateLogIn,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { error } = validateLogIn(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  let user: User | null;
  const { userNameOrEmail, password } = req.body;
  try {
    user = await User.findOne({
      where: {
        [Op.or]: [
          {
            userName: userNameOrEmail,
          },
          {
            email: userNameOrEmail,
          },
        ],
        googleId: null,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: {
        userNameOrEmail: USER_NOT_FOUND,
      },
    });
  }
  if (!user.confirmed) {
    return res.status(401).send({
      errors: NOT_CONFIRMED,
    });
  }
  const isBlackListed = await checkBlackList(user);
  if (isBlackListed) {
    return res.status(401).send({
      errors: USER_IS_BLACK_LISTED,
    });
  }
  const PasswordsMatch = await compare(password, user.password);
  if (!PasswordsMatch) {
    return res.status(400).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({ token: jwt.token, expiresIn: jwt.expires });
};
