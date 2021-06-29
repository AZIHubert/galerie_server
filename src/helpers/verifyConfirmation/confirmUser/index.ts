import { Request } from 'express';
import { verify } from 'jsonwebtoken';

import accEnv from '#src/helpers/accEnv';
import {
  INVALID_UUID,
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
} from '#src/helpers/errorMessages';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
  confirmTokenVersion: number;
  id: string;
}

export default (req: Request) => {
  const { confirmation } = req.headers;
  let confirmTokenVersion: number;
  let id: string;

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
      errors: WRONG_TOKEN,
      status: 401,
    } as Error;
  }

  try {
    const verifiedToken = verify(
      token,
      CONFIRM_SECRET,
    ) as {
      id: string;
      confirmTokenVersion: number;
    };
    id = verifiedToken.id;
    confirmTokenVersion = verifiedToken.confirmTokenVersion;
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
    confirmTokenVersion,
    id,
  } as Success;
};
