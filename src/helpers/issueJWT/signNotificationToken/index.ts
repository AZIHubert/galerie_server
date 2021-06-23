import fs from 'fs';
import { sign } from 'jsonwebtoken';
import path from 'path';

import notificationType from '@src/helpers/notificationTypes';

const PRIV_KEY = fs.readFileSync(path.join('./id_rsa_priv.notificationToken.pem'));

export default (
  type: typeof notificationType[number],
  data: any,
) => {
  const payload = {
    data,
    type,
  };
  const signedToken = sign(
    payload,
    PRIV_KEY,
    {
      algorithm: 'RS256',
    },
  );
  return {
    token: `Bearer ${signedToken}`,
  };
};
