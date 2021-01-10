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

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

export default async (req: Request, res: Response) => {
  const { confirmation } = req.headers;
  if (!confirmation) {
    return res.status(401).send({
      errors: 'confirmation token not found',
    });
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: 'wrong token',
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
      errors: 'wrong user id',
    });
  }
  if (updatedEmailTokenVersion !== user.updatedEmailTokenVersion) {
    return res.status(401).send({
      errors: 'incorrect token version',
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
        password: 'is required',
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
        password: 'wrong password',
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
