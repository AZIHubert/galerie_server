import {
  Request,
  Response,
} from 'express';

import {
  BetaKey,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePutBetaKeysIdBody,
} from '@src/helpers/schemas';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    betaKeyId,
  } = req.params;
  const currentUser = req.user as User;
  let betaKey: BetaKey | null;
  let betaKeyWithEmail: BetaKey | null;
  let user: User | null;

  // Check if request.params.betaKeyId is a UUIDv4.
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

  // Only the creator of this betaKey
  // is allow to update it.
  if (betaKey.createdById !== currentUser.id) {
    return res.status(400).send({
      errors: 'you only can modify a beta key you have posted',
    });
  }

  // Check if email is not
  // already defined.
  if (betaKey.email) {
    return res.status(400).send({
      errors: 'you can\'t update an beta key if email is already defined',
    });
  }

  // validate request.body.
  const {
    error,
    value,
  } = validatePutBetaKeysIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // the updated email
  // can\'t be already
  // registered on a beta key.
  try {
    betaKeyWithEmail = await BetaKey.findOne({
      where: {
        email: value.email,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (betaKeyWithEmail) {
    return res.status(400).send({
      errors: 'this email is already used on a beta key',
    });
  }

  // the updated email
  // can't be used by a registered user.
  try {
    user = await User.findOne({
      where: {
        email: value.email,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (user) {
    return res.status(400).send({
      errors: {
        email: 'this email is already used with this email',
      },
    });
  }

  // Update blackList.
  try {
    await betaKey.update({ email: value.email });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      betaKeyId,
      email: betaKey.email,
    },
  });
};
