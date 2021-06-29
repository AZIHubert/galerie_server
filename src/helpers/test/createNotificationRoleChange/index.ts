import {
  Notification,
} from '#src/db/models';

export default async ({
  role,
  userId,
}: {
  role: 'admin' | 'superAdmin' | 'user';
  userId: string;
}) => {
  const notification = await Notification.create({
    role,
    type: 'ROLE_CHANGE',
    userId,
  });
  return notification;
};
