import {
  Notification,
  User,
} from '@src/db/models';

import { userExcluder } from '@src/helpers/excluders';

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
        as: 'notificationsUserSubscribe',
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
    notificationsUserSubscribe: undefined,
  }));
  return {
    ...notification.toJSON(),
    frame: undefined,
    role: undefined,
    users: normalizedUsers,
  };
};
