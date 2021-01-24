// import { Request } from 'express';
// import { sign } from 'jsonwebtoken';

// import User from '@src/db/models/user';
// import accEnv from '@src/helpers/accEnv';

// // const ACCES_SECRET = accEnv('ACCES_SECRET');
// const REFRESH_SECRET = accEnv('REFRESH_SECRET');

// declare module 'express-session' {
//   export interface Session {
//     jid: string | undefined;
//   }
// }

// export const createAccessToken = (user: User) => sign(
//   {
//     id: user.id,
//     authTokenVersion: user.authTokenVersion,
//   },
//   ACCES_SECRET,
//   { expiresIn: '15m' },
// );

// export const createRefreshToken = (user: User) => sign(
//   {
//     id: user.id,
//     authTokenVersion: user.authTokenVersion,
//   },
//   REFRESH_SECRET,
//   { expiresIn: '7d' },
// );

// export const sendRefreshToken = (req: Request, token: string) => {
//   req.session.jid = token;
// };
