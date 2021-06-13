import {
  GalerieUser,
} from '@src/db/models';

export default async ({
  galerieId,
  hasNewFrames = false,
  role = 'user',
  userId,
}: {
  galerieId: string;
  hasNewFrames?: boolean;
  role?: 'admin' | 'creator' | 'user';
  userId: string;
}) => {
  const galerieUser = await GalerieUser.create({
    galerieId,
    hasNewFrames,
    role,
    userId,
  });
  return galerieUser;
};
