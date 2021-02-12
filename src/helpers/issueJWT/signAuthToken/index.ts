import fs from 'fs';
import { sign } from 'jsonwebtoken';
import path from 'path';

import { User } from '@src/db/models';

const PRIV_KEY = fs.readFileSync(path.join('./id_rsa_priv.authToken.pem'));

export default ({ id, authTokenVersion }: User) => {
  const expiresIn = 20;
  const payload = {
    sub: id,
    authTokenVersion,
    iat: Math.floor(Date.now() / 1000),
  };
  const signedToken = sign(payload, PRIV_KEY, { expiresIn, algorithm: 'RS256' });
  return {
    token: `Bearer ${signedToken}`,
    expires: expiresIn,
  };
};
