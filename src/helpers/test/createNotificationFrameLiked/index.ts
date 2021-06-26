import {
  Notification,
  NotificationFrameLiked,
} from '@src/db/models';

export default async ({
  frameId,
  userId,
  likedById,
}: {
  frameId: string;
  userId: string;
  likedById: string;
}) => {
  const notification = await Notification.create({
    frameId,
    num: 1,
    type: 'FRAME_LIKED',
    userId,
  });
  await NotificationFrameLiked.create({
    notificationId: notification.id,
    userId: likedById,
  });
  return notification;
};
