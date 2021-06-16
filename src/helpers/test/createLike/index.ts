import {
  Frame,
  Like,
} from '@src/db/models';

export default async ({
  frameId,
  incrementNumOfLikes = false,
  userId,
}: {
  frameId: string;
  incrementNumOfLikes?: boolean;
  userId: string;
}) => {
  const like = await Like.create({
    frameId,
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
