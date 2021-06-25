import {
  Notification,
} from '@src/db/models';

export default async ({
  frameId,
  galerieId,
  num,
  type,
  userId,
}: {
  frameId?: string;
  galerieId?: string;
  num?: number;
  type:
  'BETA_KEY_USED' |
  'FRAME_LIKED' |
  'FRAME_POSTED' |
  'USER_SUBSCRIBE';
  userId: string;
}) => {
  const notification = await Notification.create({
    frameId,
    galerieId,
    num,
    type,
    userId,
  });
  return notification;
};
