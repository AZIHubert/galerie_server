import {
  Frame,
  Like,
} from '@src/db/models';

export default async ({
  frameId,
  incrementNumOfLikes = false,
  notificationHasBeenSend = false,
  userId,
}: {
  frameId: string;
  incrementNumOfLikes?: boolean;
  notificationHasBeenSend?: boolean;
  userId: string;
}) => {
  const like = await Like.create({
    frameId,
    notificationHasBeenSend,
    userId,
  });
  if (incrementNumOfLikes) {
    await Frame.increment({
      numOfLikes: 1,
    }, {
      where: {
        id: frameId,
      },
    });
  }
  return like;
};
