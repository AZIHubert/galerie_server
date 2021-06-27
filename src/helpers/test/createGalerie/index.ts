import {
  Galerie,
  GalerieUser,
} from '@src/db/models';

export default async ({
  allowNotification,
  archived = false,
  userId,
  description,
  name = 'galerie\'s name',
  role = 'creator',
}: {
  allowNotification?: boolean;
  archived?: boolean;
  userId: string;
  description?: string;
  name?: string;
  role?: 'admin' | 'creator' | 'user';
}) => {
  const galerie = await Galerie.create({
    archived,
    defaultCoverPicture: 'defaultCoverPicture',
    description,
    name,
  });
  await GalerieUser.create({
    allowNotification,
    galerieId: galerie.id,
    hasNewFrames: false,
    role,
    userId,
  });
  return galerie;
};
