import {
  BlackList,
  User,
} from '@src/db/models';

export default async ({
  active = true,
  createdById,
  reason = 'black list\'s reason',
  time,
  updatedById,
  userId,
} : {
  active?: boolean;
  createdById?: string;
  reason?: string;
  time?: number;
  updatedById?: string;
  userId: string;
}) => {
  const blackList = await BlackList.create({
    createdById,
    reason,
    time: time ? new Date(Date.now() + time) : null,
    updatedById,
    userId,
  });
  if (active) {
    await User.update({
      blackListedAt: new Date(Date.now()),
      isBlackListed: true,
    }, {
      where: {
        id: userId,
        isBlackListed: false,
      },
    });
  }

  return blackList;
};
