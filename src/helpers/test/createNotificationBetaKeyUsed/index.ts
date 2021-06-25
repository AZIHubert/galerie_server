import {
  Notification,
  NotificationBetaKeyUsed,
} from '@src/db/models';

export default async ({
  userId,
  usedById,
}: {
  userId: string;
  usedById: string;
}) => {
  const notification = await Notification.create({
    type: 'BETA_KEY_USED',
    userId,
  });
  await NotificationBetaKeyUsed.create({
    notificationId: notification.id,
    userId: usedById,
  });
};
