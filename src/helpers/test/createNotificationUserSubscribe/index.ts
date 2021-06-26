import {
  Notification,
  NotificationUserSubscribe,
} from '@src/db/models';

export default async ({
  galerieId,
  userId,
  subscribeUserId,
}: {
  galerieId: string;
  userId: string;
  subscribeUserId: string;
}) => {
  const notification = await Notification.create({
    galerieId,
    num: 1,
    type: 'USER_SUBSCRIBE',
    userId,
  });
  await NotificationUserSubscribe.create({
    notificationId: notification.id,
    userId: subscribeUserId,
  });
  return notification;
};
