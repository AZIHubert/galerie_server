import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import _ from 'lodash';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { sendConfirmAccount } from '@src/helpers/email';
import saltRounds from '@src/helpers/saltRounds';
import {
  validateSignIn,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

const normalizeSequelizeErrors = async (email: string, userName: string) => {
  const normalizeErrors: any = {};
  const emailAlreadyUse = await User.findOne({ where: { email } });
  if (emailAlreadyUse) {
    normalizeErrors.email = 'already taken';
  }
  const userNameAlreadyUse = await User.findOne({ where: { userName } });
  if (userNameAlreadyUse) {
    normalizeErrors.userName = 'already taken';
  }
  return normalizeErrors;
};

export default async (req: Request, res: Response) => {
  try {
    // Validate body with Joi
    const { error } = validateSignIn(req.body);
    // If error, send status 400
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }

    // Check if username or email are not already taken
    const errors = await normalizeSequelizeErrors(req.body.email, req.body.userName);
    if (Object.keys(errors).length) {
      return res.status(400).send({
        errors,
      });
    }

    // Save user
    const hashPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: hashPassword,
    });

    // Send an email with a jwt to confirm account
    sign(
      {
        user: _.pick(newUser, 'id'),
      },
      CONFIRM_SECRET,
      {
        expiresIn: '2d',
      },
      (err, emailToken) => {
        if (err) throw new Error(`something went wrong: ${err}`);
        if (emailToken) sendConfirmAccount(req.body.email, emailToken);
      },
    );
    return res.status(201).send(newUser);
  } catch (err) {
    return res.status(500).send('something went wrong.');
  }
};
