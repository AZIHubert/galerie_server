// PUT /users/:userId/role/

import {
  Request,
  Response,
} from 'express';

import {
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  WRONG_PASSWORD,
} from '#src/helpers/errorMessages';
import { signNotificationToken } from '#src/helpers/issueJWT';
import {
  normalizeJoiErrors,
  validatePutUsersIdRoleBody,
} from '#src/helpers/schemas';
import validatePassword from '#src/helpers/validatePassword';
import uuidValidateV4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    userId,
  } = req.params;
  const currentUser = req.user as User;
  const errors: {
    password?: string;
    role?: string;
  } = {};
  let user: User | null;

  // Check if request.params.userId is a UUIDv4.
  if (!uuidValidateV4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Validate request.body.
  const {
    value,
    error,
  } = validatePutUsersIdRoleBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // validate request.body.password
  try {
    const passwordIsValid = validatePassword(
      value.password,
      currentUser.hash,
      currentUser.salt,
    );
    if (!passwordIsValid) {
      errors.password = WRONG_PASSWORD;
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  // Validate request.body.role.
  if (
    req.body.role !== 'admin'
    && req.body.role !== 'superAdmin'
    && req.body.role !== 'user'
  ) {
    errors.role = 'role should be \'admin\', \'superAdmin\' or \'user\'';
  }

  // send errors if object errors has key(s).
  if (Object.keys(errors).length) {
    return res.status(400).send({
      errors,
    });
  }

  // Fetch user.
  try {
    user = await User.findByPk(userId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // User cannot be a superAdmin.
  if (user.role === 'superAdmin') {
    return res.status(400).send({
      errors: 'you cannot update the role of a superAdmin',
    });
  }

  if (user.role === req.body.role) {
    return res.status(400).send({
      errors: {
        role: 'role should be different has the actual one',
      },
    });
  }

  // Update user role.
  try {
    await user.update({
      role: req.body.role,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const { token: notificationToken } = signNotificationToken('ROLE_CHANGE', {
    role: user.role,
    userId,
  });

  return res.status(200).send({
    action: 'PUT',
    data: {
      notificationToken,
      role: user.role,
      userId,
    },
  });
};
