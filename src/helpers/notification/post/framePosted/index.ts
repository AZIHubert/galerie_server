import { Op } from 'sequelize';

import {
  Frame,
  Notification,
  NotificationFramePosted,
  GalerieUser,
  User,
} from '@src/db/models';

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
  frameId,
}: {
  frameId?: any;
}) => {
  let frame: Frame | null;
  let galerieUsers: GalerieUser[];

  // Check if request.body.userId is a UUIDv4.
  if (!uuidValidateV4(frameId)) {
    return {
      OK: false,
      errors: INVALID_UUID('frame'),
      status: 400,
    } as Error;
  }

  // Fetch frame.
  try {
    frame = await Frame.findByPk(frameId);
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Check if frame exist.
  if (!frame) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('frame'),
      status: 404,
    } as Error;
  }

  // Check if notification has not already been sent.
  if (frame.notificationHasBeenSend) {
    return {
      OK: false,
      errors: NOTIFICATION_ALREADY_SEND('frame'),
      status: 400,
    } as Error;
  }

  // Set frame.notificationHasBeenSend === true
  // to not allow to send notification relative
  // to this frame.
  try {
    await frame.update({
      notificationHasBeenSend: true,
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Fetch all users (except the one who post
  // the frame) subscribe to the galerie where
  // frame has been posted.
  try {
    galerieUsers = await GalerieUser.findAll({
      where: {
        galerieId: frame.galerieId,
        userId: {
          [Op.not]: frame.userId,
        },
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // If no user are subscribe to the galerie
  // return OK: true.
  if (!galerieUsers.length) {
    return { OK: true } as Success;
  }

  // Create or increment notification.
  try {
    await Promise.all(
      galerieUsers.map(
        async (galerieUser) => {
          // Create notification if
          // galerieUser.allowNotification === true.
          if (galerieUser.allowNotification) {
            const notification = await Notification.findOne({
              where: {
                galerieId: frame!.galerieId,
                type: 'FRAME_POSTED',
                userId: galerieUser.userId,
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
            if (notification) {
              await notification.update({
                num: notification.num + 1,
                seen: false,
              });
              await NotificationFramePosted.create({
                notificationId: notification.id,
                frameId,
              });
            } else {
              const { id: notificationId } = await Notification.create({
                galerieId: frame!.galerieId,
                num: 1,
                type: 'FRAME_POSTED',
                userId: galerieUser.userId,
              });
              await NotificationFramePosted.create({
                notificationId,
                frameId,
              });
            }
            await User.update({
              hasNewNotifications: true,
            }, {
              where: {
                id: galerieUser.userId,
              },
            });
          }
        },
      ),
    );
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  return { OK: true } as Success;
};
