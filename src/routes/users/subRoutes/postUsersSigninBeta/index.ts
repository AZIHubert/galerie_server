import {
  Request,
  Response,
} from 'express';

import {
  BetaKey,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  FIELD_IS_ALREADY_TAKEN,
} from '@src/helpers/errorMessages';
import {
  userExcluder,
} from '@src/helpers/excluders';
import genPassword from '@src/helpers/genPassword';
import {
  normalizeJoiErrors,
  validatePostUsersSigninBetaBody,
} from '@src/helpers/schemas';

const IS_BETA = accEnv('IS_BETA', 'true');

// Normalize Sequelize errors for response
// if email or `@{userName}` are already registered.
const normalizeSequelizeErrors = async (email: string, userName: string) => {
  const normalizeErrors: any = {};
  const emailAlreadyUse = await User.findOne({ where: { email } });
  if (emailAlreadyUse) {
    normalizeErrors.email = FIELD_IS_ALREADY_TAKEN;
  }
  const userNameAlreadyUse = await User.findOne({ where: { userName } });
  if (userNameAlreadyUse) {
    normalizeErrors.userName = FIELD_IS_ALREADY_TAKEN;
  }
  return normalizeErrors;
};

// Check if betaKey is not already used.

export default async (req: Request, res: Response) => {
  const objectUserExcluder: { [key: string]: undefined } = {};
  let betaKey: BetaKey | null;
  let errors: any;
  let newUser: User;

  if (IS_BETA === 'false') {
    return res.status(400).send({
      errors: 'you can\'t signin with this route',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostUsersSigninBetaBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Fetch betaKey.
  try {
    betaKey = await BetaKey.findOne({
      where: {
        code: value.betaKey,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if betaKey exist.
  if (!betaKey) {
    return res.status(400).send({
      errors: {
        betaKey: 'this betaKey doesn\'t exist',
      },
    });
  }

  // Check if betaKey is not already used.
  if (betaKey.userId) {
    return res.status(400).send({
      errors: {
        betaKey: 'this beta key is already used',
      },
    });
  }

  // Check if email/userName is not already taken.
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

  // Create user.
  try {
    const {
      hash,
      salt,
    } = genPassword(value.password);
    newUser = await User.create({
      email: value.email,
      hash,
      pseudonym: value.userName,
      salt,
      userName: `@${value.userName}`,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Update betaKey
  try {
    await betaKey.update({ userId: newUser.id });
  } catch (err) {
    return res.status(500).send(err);
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  // Return user with only
  // relevent fields.
  const normalizeUser = {
    ...newUser.toJSON(),
    ...objectUserExcluder,
    currentProfilePicture: null,
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      user: normalizeUser,
    },
  });
};
