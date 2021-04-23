import { Request } from 'express';
import { verify } from 'jsonwebtoken';

import accEnv from '@src/helpers/accEnv';
import {
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
} from '@src/helpers/errorMessages';

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
  id: string;
  updatedEmailTokenVersion: number;
  updatedEmail: string;
}

export default (req: Request) => {
  const { confirmation } = req.headers;
  let id: string;
  let updatedEmail: string;
  let updatedEmailTokenVersion: number;

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

  try {
    const verifiedToken = verify(
      token,
      UPDATE_EMAIL_SECRET,
    ) as {
      id: string;
      updatedEmail: string;
      updatedEmailTokenVersion: number;
    };
    id = verifiedToken.id;
    updatedEmail = verifiedToken.updatedEmail;
    updatedEmailTokenVersion = verifiedToken.updatedEmailTokenVersion;
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  return {
    OK: true,
    id,
    updatedEmail,
    updatedEmailTokenVersion,
  } as Success;
};
