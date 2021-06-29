import {
  Notification,
  NotificationUserSubscribe,
} from '#src/db/models';

export default async ({
  galerieId,
  num,
  seen,
  userId,
  subscribedUserId,
}: {
  galerieId: string;
  num?: number;
  seen?: boolean;
  userId: string;
  subscribedUserId?: string;
}) => {
  const notification = await Notification.create({
    galerieId,
    num: num || 1,
    seen: seen || false,
    type: 'USER_SUBSCRIBE',
    userId,
  });
  if (subscribedUserId) {
    await NotificationUserSubscribe.create({
      notificationId: notification.id,
      userId: subscribedUserId,
    });
  }
  return notification;
};
