import {
  Galerie,
  GalerieUser,
} from '#src/db/models';

import generateGalerieHiddenName from '#src/helpers/generateGalerieHiddenName';

export default async ({
  allowNotification,
  userId,
  description,
  name = 'galerie\'s name',
  role = 'admin',
}: {
  allowNotification?: boolean;
  userId: string;
  description?: string;
  name?: string;
  role?: 'admin' | 'moderator' | 'user';
}) => {
  const hiddenName = await generateGalerieHiddenName(name);
  const galerie = await Galerie.create({
    defaultCoverPicture: 'defaultCoverPicture',
    description,
    hiddenName,
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
