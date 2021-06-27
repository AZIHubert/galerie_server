import {
  Notification,
  User,
} from '@src/db/models';

import {
  userExcluder,
} from '@src/helpers/excluders';

export default async (
  notification: Notification,
) => {
  const users = await User.findAll({
    attributes: {
      exclude: [
        ...userExcluder,
        'hasNewNotifications',
      ],
    },
    include: [
      {
        as: 'notificationsFrameLiked',
        model: Notification,
        where: {
          id: notification.id,
        },
      },
    ],
    limit: 4,
  });
  const normalizedUsers = users.map((user) => ({
    ...user.toJSON(),
    notificationsBetaKeyUsed: undefined,
  }));
  return {
    ...notification.toJSON(),
    galerie: undefined,
    role: undefined,
    users: normalizedUsers,
  };
};
