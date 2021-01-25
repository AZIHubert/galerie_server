import 'express-session';

declare module 'express-session' {
  export interface SessionData {
    refreshToken: string;
  }
}
