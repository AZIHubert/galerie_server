import bcrypt from 'bcrypt';
import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import {
  ALREADY_TAKEN,
} from '@src/helpers/errorMessages';
import saltRounds from '@src/helpers/saltRounds';
import {
  normalizeJoiErrors,
  validatePostUsersSigninBody,
} from '@src/helpers/schemas';

// Normalize Sequelize errors for response
// if email or `@{userName}` are already registered.
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
  let errors: any;
  let newUser: User;

  const {
    error,
    value,
  } = validatePostUsersSigninBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    errors = await normalizeSequelizeErrors(
      value.email,
      `@${value.userName}`,
    );
  } catch (err) {
    return res.status(500).send(err);
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }

  try {
    const hashPassword = await bcrypt.hash(value.password, saltRounds);
    newUser = await User.create({
      email: value.email,
      password: hashPassword,
      pseudonym: value.userName,
      userName: `@${value.userName}`,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Return user with only
  // relevent fields.
  const normalizeUser = {
    ...newUser.toJSON(),
    authTokenVersion: undefined,
    confirmed: undefined,
    confirmTokenVersion: undefined,
    createdAt: undefined,
    emailTokenVersion: undefined,
    facebookId: undefined,
    googleId: undefined,
    resetPasswordTokenVersion: undefined,
    password: undefined,
    updatedAt: undefined,
  };
  return res.status(200).send({
    action: 'POST',
    data: {
      user: normalizeUser,
    },
  });
};
