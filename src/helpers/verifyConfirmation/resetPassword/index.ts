import { Request } from 'express';
import { verify } from 'jsonwebtoken';

import accEnv from '@src/helpers/accEnv';
import {
  INVALID_UUID,
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
} from '@src/helpers/errorMessages';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
  id: string;
  resetPasswordTokenVersion: number;
}

export default (req: Request) => {
  const { confirmation } = req.headers;
  let id: string;
  let resetPasswordTokenVersion: number;

  if (!confirmation) {
    return {
      OK: false,
      errors: TOKEN_NOT_FOUND,
      status: 401,
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
      RESET_PASSWORD_SECRET,
    ) as {
      id: string;
      resetPasswordTokenVersion: number;
    };
    id = verifiedToken.id;
    resetPasswordTokenVersion = verifiedToken.resetPasswordTokenVersion;
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  if (!uuidValidateV4(id)) {
    return {
      OK: false,
      errors: `confirmation token error: ${INVALID_UUID('user')}`,
      status: 400,
    } as Error;
  }

  return {
    OK: true,
    id,
    resetPasswordTokenVersion,
  } as Success;
};
