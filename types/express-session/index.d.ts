/* eslint-disable no-unused-vars */
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    refreshToken: string;
  }
}
