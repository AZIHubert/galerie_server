import {
  Notification,
} from '#src/db/models';

export default async ({
  galerieId,
  role,
  userId,
}: {
  galerieId: string;
  role: 'admin' | 'moderator';
  userId: string;
}) => {
  const notification = await Notification.create({
    galerieId,
    role,
    type: 'GALERIE_ROLE_CHANGE',
    userId,
  });
  return notification;
};
