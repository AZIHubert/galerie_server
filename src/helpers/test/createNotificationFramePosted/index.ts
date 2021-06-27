import {
  Notification,
  NotificationFramePosted,
} from '@src/db/models';

export default async ({
  frameId,
  galerieId,
  userId,
}: {
  frameId: string;
  galerieId: string;
  userId: string;
}) => {
  const notification = await Notification.create({
    galerieId,
    num: 1,
    type: 'FRAME_POSTED',
    userId,
  });
  await NotificationFramePosted.create({
    notificationId: notification.id,
    frameId,
  });
  return notification;
};
