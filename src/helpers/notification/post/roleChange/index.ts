import {
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
  role,
  userId,
}: {
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

  // check is notificationtoken.data.role is valid.
  if (
    role !== 'admin'
    && role !== 'moderator'
    && role !== 'user'
  ) {
    return {
      OK: false,
      errors: 'invalide role',
      status: 400,
    } as Error;
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId);
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

  // If user.role is not the same as notificationtoken.data.role
  // do not create a notification.
  if (user.role !== role) {
    return { OK: true } as Success;
  }

  // Create notification.
  try {
    await Notification.create({
      role,
      type: 'ROLE_CHANGE',
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
