import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  Notification,
  User,
} from '@src/db/models';

import {
  betaKeyUsed,
  frameLiked,
  framePosted,
  roleChange,
  userSubscribe,
} from '@src/helpers/notification/fetch';

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const currentUser = req.user as User;
  const limit = 6;
  let normalizedNotifications: any[];
  let notifications: Notification[];
  let offset: number;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    notifications = await Notification.findAll({
      attributes: {
        exclude: [
          'frameId',
          'galerieId',
          'userId',
        ],
      },
      include: [
        {
          attributes: {
            exclude: [
              'createdAt',
              'description',
              'notificationHasBeenSend',
              'numOfLikes',
              'updatedAt',
              'userId',
            ],
          },
          as: 'frame',
          model: Frame,
        },
        {
          attributes: {
            exclude: [
              'archived',
              'createdAt',
              'description',
              'updatedAt',
            ],
          },
          model: Galerie,
        },
      ],
      limit,
      offset,
      order: [['updatedAt', 'DESC']],
      where: {
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    normalizedNotifications = await Promise.all(
      notifications.map(
        async (notification) => {
          let normalizeNotification;
          switch (notification.type) {
            case 'BETA_KEY_USED':
              normalizeNotification = await betaKeyUsed(notification);
              break;
            case 'FRAME_LIKED':
              normalizeNotification = await frameLiked(notification);
              break;
            case 'FRAME_POSTED':
              normalizeNotification = await framePosted(notification);
              break;
            case 'ROLE_CHANGE':
              normalizeNotification = roleChange(notification);
              break;
            case 'USER_SUBSCRIBE':
              normalizeNotification = await userSubscribe(notification);
              break;
            default:
              break;
          }
          return normalizeNotification;
        },
      ),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      notifications: normalizedNotifications,
    },
  });
};
