import {
  BlackList,
  User,
} from '@src/db/models';

export default async ({
  active = true,
  adminId,
  reason = 'black list\'s reason',
  time,
  updatedById,
  userId,
} : {
  active?: boolean;
  adminId: string;
  reason?: string;
  time?: number;
  updatedById?: string;
  userId: string;
}) => {
  const blackList = await BlackList.create({
    adminId,
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
