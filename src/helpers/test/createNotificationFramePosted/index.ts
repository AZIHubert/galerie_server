import {
  Notification,
  NotificationFramePosted,
} from '#src/db/models';

export default async ({
  frameId,
  galerieId,
  num,
  seen,
  userId,
}: {
  frameId?: string;
  galerieId: string;
  num?: number;
  seen?: boolean;
  userId: string;
}) => {
  const notification = await Notification.create({
    galerieId,
    num: num || 1,
    seen: seen || false,
    type: 'FRAME_POSTED',
    userId,
  });
  if (frameId) {
    await NotificationFramePosted.create({
      notificationId: notification.id,
      frameId,
    });
  }
  return notification;
};
