import {
  BetaKey,
  Notification,
  NotificationBetaKeyUsed,
  User,
} from '@src/db/models';
import { Op } from 'sequelize';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  NOTIFICATION_ALREADY_SEND,
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

const DAY = 1000 * 60 * 60 * 24;

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

  // If betaKey is not used
  // send error.
  if (!betaKey.userId) {
    return {
      OK: false,
      errors: 'beta key should be used',
      status: 400,
    } as Error;
  }

  // Check if notification has not already been sent.
  if (betaKey.notificationHasBeenSend) {
    return {
      OK: false,
      errors: NOTIFICATION_ALREADY_SEND('beta key'),
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
        [Op.or]: [
          {
            seen: false,
          },
          {
            seen: true,
            updatedAt: {
              [Op.gte]: new Date(Date.now() - DAY * 4),
            },
          },
        ],
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
      const newNotification = await Notification.create({
        num: notification.num + 1,
        type: notification.type,
        userId: notification.userId,
      });
      await NotificationBetaKeyUsed.create({
        notificationId: newNotification.id,
        userId: betaKey.userId,
      });
      await NotificationBetaKeyUsed.update({
        notificationId: newNotification.id,
      }, {
        where: {
          notificationId: notification.id,
        },
      });
      await notification.destroy();
      // Increment numOfNotification.
      await User.update({
        hasNewNotifications: true,
      }, {
        where: {
          id: betaKey.createdById,
        },
      });
    } catch (err) {
      console.log(err);
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
    const { id: notificationId } = await Notification.create({
      num: 1,
      type: 'BETA_KEY_USED',
      userId: betaKey.createdById,
    });
    await NotificationBetaKeyUsed.create({
      notificationId,
      userId: betaKey.userId,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Increment numOfNotification.
  try {
    await User.update({
      hasNewNotifications: true,
    }, {
      where: {
        id: betaKey.createdById,
      },
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
