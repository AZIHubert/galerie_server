import {
  BlackList,
} from '@src/db/models';

export default async ({
  active = true,
  adminId,
  reason = 'black list\'s reason',
  time,
  userId,
} : {
  active?: boolean,
  adminId: string;
  reason?: string;
  time?: number;
  userId: string;
}) => {
  const blackList = await BlackList.create({
    active,
    adminId,
    reason,
    time: time ? new Date(Date.now() + time) : null,
    userId,
  });

  return blackList;
};
