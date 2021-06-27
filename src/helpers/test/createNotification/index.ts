import {
  Notification,
} from '@src/db/models';

export default async ({
  frameId,
  galerieId,
  num,
  seen,
  type,
  userId,
}: {
  frameId?: string;
  galerieId?: string;
  num?: number;
  seen?: boolean,
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
    seen,
    type,
    userId,
  });
  return notification;
};
