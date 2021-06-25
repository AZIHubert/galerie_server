import {
  Request,
  Response,
} from 'express';
import fs from 'fs';
import { verify } from 'jsonwebtoken';
import path from 'path';

import {
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
} from '@src/helpers/errorMessages';
import {
  betaKeyUsed,
  frameLiked,
  framePosted,
  roleChange,
  userSubscribe,
} from '@src/helpers/postNotification';

export default async (req: Request, res: Response) => {
  const PUB_KEY = fs.readFileSync(path.join('./id_rsa_pub.notificationToken.pem'));
  const { notificationtoken } = req.headers;
  let verifyToken;
  let response;

  // Check if notification token exist.
  if (!notificationtoken) {
    return res.status(401).send({
      errors: TOKEN_NOT_FOUND,
    });
  }

  // Check if notification token is of type 'Bearer ...'.
  const token = (<string>notificationtoken).split(' ')[1];
  if (!token) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }

  // Verify notification token with the public key.
  try {
    verifyToken = verify(token, PUB_KEY) as {
      data?: any;
      type?: any;
    } | string;
  } catch (err) {
    return res.status(500).send({
      errors: err,
    });
  }

  if (typeof verifyToken !== 'object' || verifyToken === null) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }

  // Check if verifyToken.data is not an empty object
  if (
    typeof verifyToken.data !== 'object'
    || verifyToken.data === null
    || typeof verifyToken.type !== 'string'
  ) {
    return res.status(401).send({
      errors: WRONG_TOKEN,
    });
  }

  const {
    data,
  } = verifyToken;

  try {
    switch (verifyToken.type) {
      case 'BETA_KEY_USED':
        response = await betaKeyUsed(data);
        break;
      case 'FRAME_LIKED':
        response = await frameLiked(data);
        break;
      case 'FRAME_POSTED':
        response = await framePosted(data);
        break;
      case 'ROLE_CHANGE':
        response = await roleChange(data);
        break;
      case 'USER_SUBSCRIBE':
        response = await userSubscribe(data);
        break;
      default:
        response = {
          OK: false,
          errors: WRONG_TOKEN,
          status: 401,
        };
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!response.OK) {
    return res.status(response.status).send({
      errors: response.errors,
    });
  }
  return res.status(204).end();
};
