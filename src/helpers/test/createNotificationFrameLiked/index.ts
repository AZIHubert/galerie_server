import {
  Notification,
  NotificationFrameLiked,
} from '@src/db/models';

export default async ({
  frameId,
  likedById,
  num,
  seen,
  userId,
}: {
  frameId: string;
  likedById?: string;
  num?: number;
  seen?: boolean;
  userId: string;
}) => {
  const notification = await Notification.create({
    frameId,
    num: num || 1,
    seen: seen || false,
    type: 'FRAME_LIKED',
    userId,
  });
  if (likedById) {
    await NotificationFrameLiked.create({
      notificationId: notification.id,
      userId: likedById,
    });
  }
  return notification;
};
