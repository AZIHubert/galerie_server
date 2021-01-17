import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

import User from '@src/db/models/user';
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from '@src/helpers/auth';
import {
  NOT_CONFIRMED,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import {
  validateLogIn,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { error } = validateLogIn(req.body);
  let user: User | null;
  let PasswordsMatch: boolean;
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  try {
    user = await User.findOne({
      where: {
        [Op.or]: [
          {
            userName: req.body.userNameOrEmail,
          },
          {
            email: req.body.userNameOrEmail,
          },
        ],
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
  try {
    PasswordsMatch = await compare(req.body.password, user.password);
    if (!PasswordsMatch) {
      return res.status(400).send({
        errors: {
          password: WRONG_PASSWORD,
        },
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  sendRefreshToken(res, createRefreshToken(user));
  return res
    .status(200)
    .send({ accessToken: createAccessToken(user) });
};
