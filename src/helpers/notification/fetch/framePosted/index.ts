import {
  Frame,
  Notification,
} from '#src/db/models';

export default async (
  notification: Notification,
) => {
  const frames = await Frame.findAll({
    attributes: {
      exclude: [
        'createdAt',
        'description',
        'notificationHasBeenSend',
        'numOfLikes',
        'updatedAt',
        'userId',
      ],
    },
    include: [
      {
        as: 'notificationsFramePosted',
        model: Notification,
        where: {
          id: notification.id,
        },
      },
    ],
    limit: 4,
  });
  const normalizedFrames = frames.map((frame) => ({
    ...frame.toJSON(),
    notificationsFramePosted: undefined,
  }));
  return {
    ...notification.toJSON(),
    frame: undefined,
    frames: normalizedFrames,
    role: undefined,
  };
};
