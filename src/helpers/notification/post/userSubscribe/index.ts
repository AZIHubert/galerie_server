import { Op } from 'sequelize';

import {
  GalerieUser,
  Notification,
  NotificationUserSubscribe,
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
  galerieId,
  subscribedUserId,
  userId,
}: {
  galerieId: string;
  subscribedUserId: string;
  userId: string;
}) => {
  let galerieUser: GalerieUser | null;
  let galerieUserAdmin: GalerieUser | null;
  let galerieUserModerator: GalerieUser | null;
  let notification: Notification | null;

  // Check if notificationToken.data.galerieId is a UUIDv4.
  if (!uuidValidateV4(galerieId)) {
    return {
      OK: false,
      errors: INVALID_UUID('galerie'),
      status: 400,
    } as Error;
  }

  // Check if notificationToken.data.userId is a UUIDv4.
  if (!uuidValidateV4(subscribedUserId)) {
    return {
      OK: false,
      errors: INVALID_UUID('user'),
      status: 400,
    } as Error;
  }

  // Check if notificationToken.data.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return {
      OK: false,
      errors: INVALID_UUID('user'),
      status: 400,
    } as Error;
  }

  // Fetch galerieUser for the user who
  // has subscribe to the galerie.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId: subscribedUserId,
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Check if galerieUser exist.
  if (!galerieUser) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('galerieUser'),
      status: 404,
    } as Error;
  }

  // Check if notification has not already been sent.
  if (galerieUser.notificationHasBeenSend) {
    return {
      OK: false,
      errors: NOTIFICATION_ALREADY_SEND('subscription'),
      status: 400,
    } as Error;
  }

  // Set galerieUser.notificationHasBeenSend === true
  // to not allow to send notification relative
  // to this frame.
  try {
    await galerieUser.update({
      notificationHasBeenSend: true,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Fetch galerieUser of the admin of the galerie.
  try {
    galerieUserAdmin = await GalerieUser.findOne({
      where: {
        role: 'admin',
        galerieId,
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // If the galerie have a admin.
  if (galerieUserAdmin && galerieUserAdmin.allowNotification) {
    let notificationAdmin;

    // Fetch notification.
    try {
      notificationAdmin = await Notification.findOne({
        where: {
          galerieId,
          type: 'USER_SUBSCRIBE',
          userId: galerieUserAdmin.userId,
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
    // increment notification.num
    // and set seen to true.
    if (notificationAdmin) {
      try {
        const newNotification = await Notification.create({
          galerieId: notificationAdmin.galerieId,
          num: notificationAdmin.num + 1,
          type: notificationAdmin.type,
          userId: notificationAdmin.userId,
        });
        await NotificationUserSubscribe.create({
          notificationId: notificationAdmin.id,
          userId: subscribedUserId,
        });
        await NotificationUserSubscribe.update({
          notificationId: newNotification.id,
        }, {
          where: {
            notificationId: notificationAdmin.id,
          },
        });
        await notificationAdmin.destroy();
      } catch (err) {
        return {
          OK: false,
          errors: err,
          status: 500,
        } as Error;
      }

    // Else, create a notification.
    } else {
      try {
        const { id: notificationId } = await Notification.create({
          galerieId,
          num: 1,
          type: 'USER_SUBSCRIBE',
          userId: galerieUserAdmin.userId,
        });
        await NotificationUserSubscribe.create({
          notificationId,
          userId: subscribedUserId,
        });
      } catch (err) {
        return {
          OK: false,
          errors: err,
          status: 500,
        } as Error;
      }
    }

    // Set user.hasNewNotifications to true.
    try {
      await User.update({
        hasNewNotifications: true,
      }, {
        where: {
          id: galerieUserAdmin.userId,
        },
      });
    } catch (err) {
      return {
        OK: false,
        errors: err,
        status: 500,
      } as Error;
    }

    // Do not create two notification
    // if the admin of the galerie
    // and the admin of the invitation
    // are the same user.
    if (galerieUserAdmin.userId === userId) {
      return { OK: true } as Success;
    }
  }

  // Check if the creator of the invitation
  // is still subscribe to the galerie
  // or is still the moderator of the galerie.
  try {
    galerieUserModerator = await GalerieUser.findOne({
      where: {
        galerieId,
        userId,
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  if (
    !galerieUserModerator
    || galerieUserModerator.role === 'user'
    || !galerieUserModerator.allowNotification
  ) {
    return { OK: true } as Success;
  }

  // Fetch notification of
  // the moderator who post the invitation.
  try {
    notification = await Notification.findOne({
      where: {
        galerieId,
        type: 'USER_SUBSCRIBE',
        userId,
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
  // increment notification.num,
  // and set seen to false.
  if (notification) {
    try {
      const newNotification = await Notification.create({
        galerieId: notification.galerieId,
        num: notification.num + 1,
        type: notification.type,
        userId: notification.userId,
      });
      await NotificationUserSubscribe.create({
        notificationId: notification.id,
        userId: subscribedUserId,
      });
      await NotificationUserSubscribe.update({
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

  // Else, create a notification.
  } else {
    try {
      const { id: notificationId } = await Notification.create({
        galerieId,
        num: 1,
        type: 'USER_SUBSCRIBE',
        userId,
      });
      await NotificationUserSubscribe.create({
        notificationId,
        userId: subscribedUserId,
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
        id: userId,
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
