// return error
// if betaKey.createdById !== currentuser.id
// betaKey.userId !== null

import {
  Request,
  Response,
} from 'express';

import {
  BetaKey,
  User,
} from '#src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '#src/helpers/errorMessages';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    betaKeyId,
  } = req.params;
  const currentUser = req.user as User;
  let betaKey: BetaKey | null;

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

  // Return error if currentUser is not
  // the creator of this betaKey or
  // if this betaKey is used by a user.
  if (
    betaKey.createdById !== currentUser.id
    || betaKey.userId
  ) {
    return res.status(400).send({
      errors: 'you are not allow to delete this beta key',
    });
  }

  // Delete the betaKey.
  try {
    await betaKey.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      betaKeyId,
    },
  });
};
