import { compare, hash } from 'bcrypt';
import { Request, Response } from 'express';

import { User } from '@src/db/models';

import { WRONG_PASSWORD } from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import saltRounds from '@src/helpers/saltRounds';
import setRefreshToken from '@src/helpers/setRefreshToken';
import {
  validateSendUpdatePassword,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

// TODO:
// change route by /users/me/password

export default async (req: Request, res: Response) => {
  try {
    const { error } = validateSendUpdatePassword(req.body);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  const { currentPassword, newPassword } = req.body;
  const user = req.user as User;
  let passwordsMatch: boolean;
  try {
    passwordsMatch = await compare(currentPassword, user.password);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!passwordsMatch) {
    return res.status(400).send({
      errors: {
        currentPassword: WRONG_PASSWORD,
      },
    });
  }
  try {
    const hashedPassword = await hash(newPassword, saltRounds);
    await user.update({ password: hashedPassword });
    await user.increment({ authTokenVersion: 1 });
  } catch (err) {
    return res.status(500).send(err);
  }
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({ token: jwt.token, expiresIn: jwt.expires });
};
