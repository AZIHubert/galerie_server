import { Request, Response } from 'express';

import { User } from '@src/db/models';

import issueJWT from '@src/helpers/issueJWT';
import auth from '@src/helpers/auth';

export default (req: Request, res: Response) => {
  const user = req.user as User;
  const jwt = issueJWT(user);
  auth(req, user);
  return res.status(200).send({ token: jwt.token, expiresIn: jwt.expires });
};
