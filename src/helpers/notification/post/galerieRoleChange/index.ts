import {
  Galerie,
  Notification,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

interface Error {
  OK: false;
  errors: any;
  status: number;
}
interface Success {
  OK: true;
}

export default async ({
  galerieId,
  role,
  userId,
}: {
  galerieId?: any;
  role?: any;
  userId?: any;
}) => {
  let user: User | null;

  // Check if notificationtoken.data.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return {
      OK: false,
      errors: INVALID_UUID('user'),
      status: 400,
    } as Error;
  }

  // Check if notificationtoken.data.userId is a UUIDv4.
  if (!uuidValidateV4(galerieId)) {
    return {
      OK: false,
      errors: INVALID_UUID('galerie'),
      status: 400,
    } as Error;
  }

  // check is notificationtoken.data.role is valid.
  // Do not send notification if new role of the user
  // is 'user'.
  if (
    role !== 'admin'
    && role !== 'moderator'
  ) {
    return {
      OK: false,
      errors: 'invalide role',
      status: 400,
    } as Error;
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId, {
      include: [
        {
          model: Galerie,
          required: false,
          where: {
            id: galerieId,
          },
        },
      ],
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  // Check if user exist.
  if (!user) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('user'),
      status: 404,
    } as Error;
  }

  // Check if user exist.
  if (!user.galeries[0]) {
    return {
      OK: false,
      errors: MODEL_NOT_FOUND('galerie'),
      status: 404,
    } as Error;
  }

  // If user role for this galerie is not
  // the same as notificationtoken.data.role
  // do not create a notification.
  if (user.galeries[0].GalerieUser.role !== role) {
    return { OK: true } as Success;
  }

  // Create notification.
  try {
    await Notification.create({
      galerieId,
      role,
      type: 'GALERIE_ROLE_CHANGE',
      userId,
    });
    await User.update({
      hasNewNotifications: true,
    }, {
      where: {
        id: userId,
      },
    });
  } catch (err) {
    return {
      OK: false,
      errors: err,
      status: 500,
    } as Error;
  }

  return { OK: true } as Success;
};
