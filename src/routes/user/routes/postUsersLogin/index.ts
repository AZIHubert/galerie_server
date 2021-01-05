import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from '@src/helpers/auth';
import {
  validateLogIn,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { error } = validateLogIn(req.body);
  try {
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
    const user = await User.findOne({
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
    if (!user) {
      return res.status(404).send({
        errors: {
          userNameOrEmail: 'user not found',
        },
      });
    }
    if (!user.confirmed) {
      return res.status(401).send({
        errors: 'need to confirm account',
      });
    }
    const password = await compare(req.body.password, user.password);
    if (!password) {
      return res.status(400).send({
        errors: {
          password: 'wrong password',
        },
      });
    }
    sendRefreshToken(res, createRefreshToken(user));
    return res
      .status(200)
      .send({ accessToken: createAccessToken(user) });
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      errors: err,
    });
  }
};
