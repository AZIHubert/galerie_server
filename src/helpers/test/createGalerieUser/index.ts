import {
  GalerieUser,
} from '@src/db/models';

export default async ({
  allowNotification,
  galerieId,
  hasNewFrames = false,
  notificationHasBeenSend = false,
  role = 'user',
  userId,
}: {
  allowNotification?: boolean,
  galerieId: string;
  hasNewFrames?: boolean;
  notificationHasBeenSend?: boolean;
  role?: 'admin' | 'creator' | 'user';
  userId?: string;
}) => {
  const galerieUser = await GalerieUser.create({
    allowNotification,
    galerieId,
    hasNewFrames,
    notificationHasBeenSend,
    role,
    userId,
  });
  return galerieUser;
};
