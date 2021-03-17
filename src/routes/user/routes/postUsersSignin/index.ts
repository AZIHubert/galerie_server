import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import User from '@src/db/models/user';
import {
  ALREADY_TAKEN,
} from '@src/helpers/errorMessages';
import saltRounds from '@src/helpers/saltRounds';
import {
  validateSignIn,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

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
  const { error, value } = validateSignIn(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  let errors: any;
  try {
    errors = await normalizeSequelizeErrors(value.email, `@${value.userName}`);
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
    const hashPassword = await bcrypt.hash(value.password, saltRounds);
    newUser = await User.create({
      userName: `@${value.userName}`,
      email: value.email,
      password: hashPassword,
      pseudonym: value.userName,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(201).send({
    email: newUser.email,
  });
};
