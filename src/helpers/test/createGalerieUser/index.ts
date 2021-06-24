import {
  GalerieUser,
} from '@src/db/models';

export default async ({
  galerieId,
  hasNewFrames = false,
  notificationHasBeenSend = false,
  role = 'user',
  userId,
}: {
  galerieId: string;
  hasNewFrames?: boolean;
  notificationHasBeenSend?: boolean;
  role?: 'admin' | 'creator' | 'user';
  userId?: string;
}) => {
  const galerieUser = await GalerieUser.create({
    galerieId,
    hasNewFrames,
    notificationHasBeenSend,
    role,
    userId,
  });
  return galerieUser;
};
