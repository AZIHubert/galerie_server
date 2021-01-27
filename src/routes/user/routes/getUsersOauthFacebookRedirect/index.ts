import { Request, Response } from 'express';

import { User } from '@src/db/models';

import { signAuthToken } from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';

export default (req: Request, res: Response) => {
  const user = req.user as User;
  const jwt = signAuthToken(user);
  setRefreshToken(req, user);
  return res.status(200).send({ token: jwt.token, expiresIn: jwt.expires });
};
