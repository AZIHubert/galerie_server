import { Request } from 'express';
import { verify } from 'jsonwebtoken';

import accEnv from '@src/helpers/accEnv';
import {
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
} from '@src/helpers/errorMessages';

const SEND_EMAIL_SECRET = accEnv('SEND_EMAIL_SECRET');

interface Error {
  OK: false;
  status: number;
  errors: any;
}
interface Success {
  OK: true;
  id: string;
}

export default (req: Request) => {
  const { confirmation } = req.headers;
  if (!confirmation) {
    return {
      OK: false,
      status: 401,
      errors: TOKEN_NOT_FOUND,
    } as Error;
  }
  const token = (<string>confirmation).split(' ')[1];
  if (!token) {
    return {
      OK: false,
      status: 401,
      errors: WRONG_TOKEN,
    } as Error;
  }
  let id: string;
  try {
    const verifiedToken = verify(
      token,
      SEND_EMAIL_SECRET,
    ) as {
      id: string;
    };
    id = verifiedToken.id;
  } catch (err) {
    return {
      OK: false,
      status: 500,
      errors: err,
    } as Error;
  }
  return {
    OK: true,
    id,
  } as Success;
};
