import {
  Galerie,
  GalerieUser,
} from '@src/db/models';

export default async ({
  archived = false,
  userId,
  description,
  name = 'galerie\'s name',
  role = 'creator',
}: {
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
    galerieId: galerie.id,
    hasNewFrames: false,
    role,
    userId,
  });
  return galerie;
};
