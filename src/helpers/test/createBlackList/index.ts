import {
  BlackList,
} from '@src/db/models';

export default async ({
  active = true,
  adminId,
  reason = 'black list\'s reason',
  time,
  updatedById,
  userId,
} : {
  active?: boolean,
  adminId: string;
  reason?: string;
  time?: number;
  updatedById?: string;
  userId: string;
}) => {
  const blackList = await BlackList.create({
    active,
    adminId,
    reason,
    time: time ? new Date(Date.now() + time) : null,
    updatedById,
    userId,
  });

  return blackList;
};