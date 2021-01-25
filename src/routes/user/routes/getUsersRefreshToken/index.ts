import { Request, Response } from 'express';
import fs from 'fs';
import { verify } from 'jsonwebtoken';
import path from 'path';

import { User } from '@src/db/models';

import {
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import { signAuthToken } from '@src/helpers/issueJWT';
import setRefreshToken from '@src/helpers/setRefreshToken';

export default (req: Request, res: Response) => {
  const { refreshToken } = req.session;
  if (!refreshToken) {
    return res.status(401).send({
      errors: 'refresh token not found',
    });
  }
  const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.refreshToken.pem'));
  let id: string;
  let authTokenVersion: number;
  try {
    const verifyToken = verify(refreshToken, PUB_KEY) as {
      sub: string;
      authTokenVersion: number;
      iat: number;
    };
    id = verifyToken.sub;
    authTokenVersion = verifyToken.authTokenVersion;
  } catch (err) {
    req.session.destroy((sessionError) => res.status(401).send({
      errors: sessionError,
    }));
    return res.status(500).send(err);
  }
  const user = req.user as User;
  if (id !== user.id) {
    req.session.destroy((sessionError) => res.status(401).send({
      errors: sessionError,
    }));
    return res.status(401).send({
      errors: WRONG_TOKEN_USER_ID,
    });
  }
  if (authTokenVersion !== user.authTokenVersion) {
    req.session.destroy((sessionError) => res.status(401).send({
      errors: sessionError,
    }));
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({ token: jwt.token, expiresIn: jwt.expires });
};
