import {
  Notification,
  NotificationBetaKeyUsed,
} from '#src/db/models';

export default async ({
  num,
  seen,
  userId,
  usedById,
}: {
  num?: number;
  seen?: boolean;
  userId: string;
  usedById?: string;
}) => {
  const notification = await Notification.create({
    num: num || 1,
    seen: seen || false,
    type: 'BETA_KEY_USED',
    userId,
  });
  if (usedById) {
    await NotificationBetaKeyUsed.create({
      notificationId: notification.id,
      userId: usedById,
    });
  }
  return notification;
};
