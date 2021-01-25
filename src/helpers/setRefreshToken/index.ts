import { Request } from 'express';

import { User } from '@src/db/models';

import { signRefreshToken } from '@src/helpers/issueJWT';

declare module 'express-session' {
  export interface SessionData {
    refreshToken: string;
  }
}

export default (req: Request, user: User) => {
  req.session.refreshToken = signRefreshToken(user);
};
