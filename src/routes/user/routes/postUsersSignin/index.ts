import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  ALREADY_TAKEN,
} from '@src/helpers/errorMessages';
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
    normalizeErrors.email = ALREADY_TAKEN;
  }
  const userNameAlreadyUse = await User.findOne({ where: { userName } });
  if (userNameAlreadyUse) {
    normalizeErrors.userName = ALREADY_TAKEN;
  }
  return normalizeErrors;
};

export default async (req: Request, res: Response) => {
  const { error } = validateSignIn(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  let errors: any;
  try {
    errors = await normalizeSequelizeErrors(req.body.email, req.body.userName);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }
  let newUser: User;
  try {
    const hashPassword = await bcrypt.hash(req.body.password, saltRounds);
    newUser = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: hashPassword,
    });
    sign(
      {
        id: newUser.id,
        confirmTokenVersion: newUser.confirmTokenVersion,
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
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(201).send(newUser);
};

// https://github.com/zachgoll/express-jwt-authentication-starter/blob/master/lib/utils.js
// user salt => genPassword(password).salt
// user hash => genPassword(password).hash
// user remove password
