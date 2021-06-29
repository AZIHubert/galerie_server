import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

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
import isNormalInteger from '@src/helpers/isNormalInteger';

export default async (req: Request, res: Response) => {
  const {
    previousNotification,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 6;
  const where: {
    autoIncrementId?: any;
  } = {};
  let normalizedNotifications: any[];
  let notifications: Notification[];

  if (previousNotification && isNormalInteger(previousNotification.toString())) {
    where.autoIncrementId = {
      [Op.lt]: previousNotification.toString(),
    };
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
      order: [['autoIncrementId', 'DESC']],
      where: {
        ...where,
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
