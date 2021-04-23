import fs from 'fs';
import { sign } from 'jsonwebtoken';
import path from 'path';

import { User } from '@src/db/models';

const PRIV_KEY = fs.readFileSync(path.join('./id_rsa_priv.authToken.pem'));

export default ({ id, authTokenVersion }: User) => {
  const expiresIn = 1800;
  const payload = {
    authTokenVersion,
    iat: Math.floor(Date.now() / 1000),
    sub: id,
  };
  const signedToken = sign(
    payload,
    PRIV_KEY,
    {
      algorithm: 'RS256',
      expiresIn,
    },
  );
  return {
    expires: expiresIn,
    token: `Bearer ${signedToken}`,
  };
};
