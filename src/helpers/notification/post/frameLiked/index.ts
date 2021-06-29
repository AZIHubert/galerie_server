import { Op } from 'sequelize';

import {
  Frame,
  GalerieUser,
  Like,
  Notification,
  NotificationFrameLiked,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  NOTIFICATION_ALREADY_SEND,
} from '#src/helpers/errorMessages';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

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
  likeId,
}: {
  likeId?: any;
}) => {
  let like: Like | null;
  let notification: Notification | null;
  let galerieUser: GalerieUser | null;

  // Check if notificationtoken.data.likeId is a UUIDv4.
  if (!uuidValidateV4(likeId)) {
    return {
      OK: false,
      errors: INVALID_UUID('like'),
      status: 400,
    } as Error;
  }

  // Fetch like.
  try {
    like = await Like.findByPk(likeId, {
      include: [
        {
          model: Frame,
        },
      ],
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Check if like exist.
  if (!like) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('like'),
      status: 404,
    } as Error;
  }

  // Check if notification has not already been sent.
  if (like.notificationHasBeenSend) {
    return {
      OK: false,
      errors: NOTIFICATION_ALREADY_SEND('like'),
      status: 400,
    } as Error;
  }

  // Fetch galerieUser.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId: like.frame.galerieId,
        userId: like.frame.userId,
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Set like.notificationHasBeenSend === true
  // to not allow to send notification relative
  // to this like.
  try {
    await like.update({
      notificationHasBeenSend: true,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Do not create notification if allowNotification === false.
  if (!galerieUser || !galerieUser.allowNotification) {
    return { OK: true } as Success;
  }

  // Fetch notification.
  try {
    notification = await Notification.findOne({
      where: {
        frameId: like.frameId,
        type: 'FRAME_LIKED',
        userId: like.frame.userId,
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
        frameId: notification.frameId,
        num: notification.num + 1,
        type: notification.type,
        userId: notification.userId,
      });
      await NotificationFrameLiked.create({
        notificationId: newNotification.id,
        userId: like.userId,
      });
      await NotificationFrameLiked.update({
        notificationId: newNotification.id,
      }, {
        where: {
          notificationId: notification.id,
        },
      });
      await notification.destroy();
    } catch (err) {
      return {
        OK: false,
        errors: err,
        status: 500,
      } as Error;
    }

  // If notification doesn't exist
  // create a notification.
  } else {
    try {
      const { id: notificationId } = await Notification.create({
        frameId: like.frameId,
        num: 1,
        type: 'FRAME_LIKED',
        userId: like.frame.userId,
      });
      await NotificationFrameLiked.create({
        notificationId,
        userId: like.userId,
      });
    } catch (err) {
      return {
        OK: false,
        errors: err,
        status: 500,
      } as Error;
    }
  }

  try {
    await User.update({
      hasNewNotifications: true,
    }, {
      where: {
        id: like.frame.userId,
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
