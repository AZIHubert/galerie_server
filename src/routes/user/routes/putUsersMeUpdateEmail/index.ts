import { compare } from 'bcrypt';
import { Request, Response } from 'express';
import { verify } from 'jsonwebtoken';

import accEnv from '@src/helpers/accEnv';
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from '@src/helpers/auth';
import User from '@root/src/db/models/user';
import {
  FIELD_IS_REQUIRED,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const { confirmation } = req.headers;
  if (!confirmation) {
    return res.status(401).send({
      errors: TOKEN_NOT_FOUND,
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }
  let id: string;
  let updatedEmailTokenVersion: number;
  let updatedEmail: string;
  try {
    const verifiedToken = verify(
      token,
      UPDATE_EMAIL_SECRET,
    ) as {
      id: string;
      updatedEmailTokenVersion: number;
      updatedEmail: string;
    };
    id = verifiedToken.id;
    updatedEmailTokenVersion = verifiedToken.updatedEmailTokenVersion;
    updatedEmail = verifiedToken.updatedEmail;
  } catch (err) {
    return res.status(500).send(err);
  }
  const { user } = res.locals;
  if (id !== user.id) {
    return res.status(401).send({
      errors: WRONG_TOKEN_USER_ID,
    });
  }
  if (updatedEmailTokenVersion !== user.updatedEmailTokenVersion) {
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
  if (!updatedEmail) {
    return res.status(401).send({
      errors: 'updated email not found',
    });
  }
  const { password } = req.body;
  if (!password) {
    return res.status(401).send({
      errors: {
        password: FIELD_IS_REQUIRED,
      },
    });
  }
  let matchedPasswords: boolean;
  try {
    matchedPasswords = await compare(password, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!matchedPasswords) {
    return res.status(401).send({
      errors: {
        password: WRONG_PASSWORD,
      },
    });
  }
  try {
    const updatedUser = await User.findByPk(id);
    await updatedUser!.update({ email: updatedEmail });
    await updatedUser!.increment({
      authTokenVersion: 1,
      updatedEmailTokenVersion: 1,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  sendRefreshToken(res, createRefreshToken(user));
  return res
    .status(200)
    .send({ accessToken: createAccessToken(user) });
};
