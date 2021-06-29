import {
  Request,
  Response,
} from 'express';

import {
  Notification,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    notificationId,
  } = req.params;
  const currentUser = req.user as User;
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

  // set notification.seen to true.
  try {
    await notification.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      notificationId,
    },
  });
};
