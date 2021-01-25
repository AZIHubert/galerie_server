import { Request } from 'express';
import fs from 'fs';
import { sign } from 'jsonwebtoken';
import path from 'path';

import { User } from '@src/db/models';

const PRIV_KEY = fs.readFileSync(path.join('./id_rsa_priv.refreshToken.pem'));

const issueToken = ({ id, authTokenVersion }: User) => {
  const payload = {
    sub: id,
    authTokenVersion,
    iat: Date.now(),
  };
  const signedToken = sign(payload, PRIV_KEY, { algorithm: 'RS256' });
  return `Bearer ${signedToken}`;
};

export default (req: Request, user: User) => {
  req.session.refreshToken = issueToken(user);
};
