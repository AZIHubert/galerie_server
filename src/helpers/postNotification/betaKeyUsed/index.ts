import {
  BetaKey,
  Notification,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
}

export default async ({
  betaKeyId,
}: {
  betaKeyId?: any;
}) => {
  let betaKey: BetaKey | null;
  let notification: Notification | null;

  // Check if request.body.userId is a UUIDv4.
  if (!uuidValidateV4(betaKeyId)) {
    return {
      OK: false,
      errors: INVALID_UUID('beta key'),
      status: 400,
    } as Error;
  }

  // Fetch betaKey.
  try {
    betaKey = await BetaKey.findByPk(betaKeyId);
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Check if betaKey Exist.
  if (!betaKey) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('beta key'),
      status: 404,
    } as Error;
  }

  // Check if notification has not already been sent.
  if (betaKey.notificationHasBeenSend) {
    return {
      OK: false,
      errors: 'notifications already send for this beta key',
      status: 400,
    } as Error;
  }

  // Set betaKey.notificationHasBeenSend === true
  // to not allow to send notification relative
  // to this like.
  try {
    await betaKey.update({
      notificationHasBeenSend: true,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // If betaKey is not used
  // stop request.
  if (!betaKey.userId) {
    return { OK: true } as Success;
  }

  // If superAdmin doesn't exist
  // stop request.
  if (!betaKey.createdById) {
    return { OK: true } as Success;
  }

  // Fetch notification.
  try {
    notification = await Notification.findOne({
      where: {
        type: 'BETA_KEY_USED',
        userId: betaKey.createdById,
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // If notification exist
  // Increment notification.num.
  if (notification) {
    try {
      await notification.increment({ num: 1 });
    } catch (err) {
      return {
        OK: false,
        errors: err,
        status: 500,
      } as Error;
    }

    return { OK: true } as Success;
  }

  // If notification doesn't exist
  // create a notification.
  try {
    await Notification.create({
      num: 1,
      type: 'BETA_KEY_USED',
      userId: betaKey.createdById,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  return { OK: true } as Success;
};
