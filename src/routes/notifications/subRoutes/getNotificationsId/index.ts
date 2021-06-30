import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  Notification,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  betaKeyUsed,
  frameLiked,
  framePosted,
  galerieRoleChange,
  roleChange,
  userSubscribe,
} from '#src/helpers/notification/fetch';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    notificationId,
  } = req.params;
  const currentUser = req.user as User;
  let normalizeNotification;
  let notification: Notification | null;

  // Check if request.params.notificationId
  // is a UUID v4.
  if (!uuidValidatev4(notificationId)) {
    return res.status(400).send({
      errors: INVALID_UUID('notification'),
    });
  }

  // Fetch notification.
  try {
    notification = await Notification.findOne({
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
              'createdAt',
              'description',
              'updatedAt',
            ],
          },
          model: Galerie,
        },
      ],
      where: {
        id: notificationId,
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if notification exist.
  if (!notification) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('notification'),
    });
  }

  // Normalize notification.
  try {
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
      case 'GALERIE_ROLE_CHANGE':
        normalizeNotification = galerieRoleChange(notification);
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
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      notification: normalizeNotification,
    },
  });
};
