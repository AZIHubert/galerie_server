import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

import {
  GalerieUser,
  Notification,
  NotificationUserSubscribe,
} from '@src/db/models';

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
}

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
  let galerieUserCreator: GalerieUser | null;
  let galerieUserAdmin: GalerieUser | null;
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
      errors: 'notifications already send for this galerieUser',
      status: 400,
    } as Error;
  }

  // TODO:
  // check if galerieUser.allowNotification === true

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

  // Fetch galerieUser of the creator of the galerie.
  try {
    galerieUserCreator = await GalerieUser.findOne({
      where: {
        role: 'creator',
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

  // If the galerie have a creator.
  if (galerieUserCreator && galerieUserCreator.allowNotification) {
    let notificationCreator;

    // Fetch notification.
    try {
      notificationCreator = await Notification.findOne({
        where: {
          galerieId,
          type: 'USER_SUBSCRIBE',
          userId: galerieUserCreator.userId,
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
    // increment notification.num.
    if (notificationCreator) {
      try {
        await notificationCreator.increment({ num: 1 });
        await NotificationUserSubscribe.create({
          notificationId: notificationCreator.id,
          userId: subscribedUserId,
        });
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
          userId: galerieUserCreator.userId,
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

    // Do not create two notification
    // if the creator of the galerie
    // and the creator of the invitation
    // are the same user.
    if (galerieUserCreator.userId === userId) {
      return { OK: true } as Success;
    }
  }

  // Check if the creator of the invitation
  // is still subscribe to the galerie
  // or is still the admin of the galerie.
  try {
    galerieUserAdmin = await GalerieUser.findOne({
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
    !galerieUserAdmin
    || galerieUserAdmin.role === 'user'
    || !galerieUserAdmin.allowNotification
  ) {
    return { OK: true } as Success;
  }

  // Fetch notification of
  // the admin who post the invitation.
  try {
    notification = await Notification.findOne({
      where: {
        galerieId,
        type: 'USER_SUBSCRIBE',
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

  // If notification exist
  // increment notification.num.
  if (notification) {
    try {
      await notification.increment({ num: 1 });
      await NotificationUserSubscribe.create({
        notificationId: notification.id,
        userId: subscribedUserId,
      });
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

  return { OK: true } as Success;
};