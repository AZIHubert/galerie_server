// GET /users/refreshToken/

import {
  Request,
  Response,
} from 'express';
import fs from 'fs';
import { verify } from 'jsonwebtoken';
import path from 'path';

import { User } from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  TOKEN_NOT_FOUND,
  WRONG_TOKEN_VERSION,
} from '#src/helpers/errorMessages';
import { signAuthToken } from '#src/helpers/issueJWT';
import setRefreshToken from '#src/helpers/setRefreshToken';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.refreshToken.pem'));
  const { refreshToken } = req.session;
  let authTokenVersion: number;
  let id: string;
  let user: User | null;

  // Check if refreshToken exist in session.
  if (!refreshToken) {
    return res.status(401).send({
      errors: TOKEN_NOT_FOUND,
    });
  }

  // Decrypt refreshToken.
  try {
    const verifyToken = verify(refreshToken, PUB_KEY) as {
      authTokenVersion: number;
      iat: number;
      sub: string;
    };
    authTokenVersion = verifyToken.authTokenVersion;
    id = verifyToken.sub;
  } catch (err) {
    req
      .session
      .destroy((sessionError) => res
        .status(401)
        .send({
          errors: sessionError,
        }));
    return res.status(500).send(err);
  }

  if (!uuidValidateV4(id)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Fetch user corresponding to decrypted token.id.
  try {
    user = await User.findByPk(id);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Check if decrypted token.authTokenVersions
  // match with user.authTokenVersion.
  if (authTokenVersion !== user.authTokenVersion) {
    req.session.destroy((sessionError) => res.status(401).send({
      errors: sessionError,
    }));
    return res.status(401).send({
      errors: WRONG_TOKEN_VERSION,
    });
  }

  // Reset session refrech token
  // and send auth token in response.
  setRefreshToken(req, user);
  const jwt = signAuthToken(user);
  return res.status(200).send({
    expiresIn: jwt.expires,
    token: jwt.token,
  });
};
