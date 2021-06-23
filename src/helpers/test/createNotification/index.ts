import {
  Notification,
} from '@src/db/models';

export default async ({
  galerieId,
  num,
  type,
  userId,
}: {
  galerieId?: string;
  num?: number;
  type: 'FRAME_POSTED';
  userId: string;
}) => {
  const notification = await Notification.create({
    galerieId,
    num,
    type,
    userId,
  });
  return notification;
};
