import {
  Response,
  Request,
} from 'express';

import {
  BetaKey,
} from '#src/db/models';

import { sendBetaKey } from '#src/helpers/email';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    betaKeyId,
  } = req.params;
  let betaKey: BetaKey | null;

  // Check if request.params.betaKeyId is a UUIDv4
  if (!uuidValidateV4(betaKeyId)) {
    return res.status(400).send({
      errors: INVALID_UUID('beta key'),
    });
  }

  // Fetch betaKey.
  try {
    betaKey = await BetaKey.findByPk(betaKeyId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if betaKey exist.
  if (!betaKey) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('beta key'),
    });
  }

  // Check if betaKey.email doesn't exist.
  if (!betaKey.email) {
    return res.status(400).send({
      errors: 'no email registered',
    });
  }

  // Check if betaKey.userId exist.
  if (betaKey.userId) {
    return res.status(400).send({
      errors: 'this beta key is already used',
    });
  }

  // Send an email to betaKey.email
  // with betaKey.code.
  sendBetaKey(betaKey.email, betaKey.code);

  return res.status(204).end();
};
