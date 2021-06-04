import { Request, Response } from 'express';

import { User } from '@src/db/models';
import {
  FIELD_IS_REQUIRED,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { role } = req.body;
  const { userId } = req.params;
  const currentUser = req.user as User;
  let user: User | null;

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  if (userId === currentUser.id) {
    return res.status(400).send({
      errors: 'you can\'t modify your role yourself',
    });
  }

  // Validate request.body.role.
  // No need to use Joi,
  // validation is simple enought.
  if (!role) {
    return res.status(400).send({
      errors: {
        role: FIELD_IS_REQUIRED,
      },
    });
  }
  if (
    role !== 'admin'
    && role !== 'superAdmin'
    && role !== 'user'
  ) {
    return res.status(400).send({
      errors: {
        role: 'role should only be admin, superAdmin or user',
      },
    });
  }

  // Fetch user.
  try {
    user = await User.findOne({
      where: {
        id: userId,
        confirmed: true,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if user exist.
  if (!user) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // Can't modifie role of a superAdmin user.
  if (user.role === 'superAdmin') {
    return res.status(400).send({
      errors: 'you can\'t modify the role of a super admin',
    });
  }

  // Return error if there is no modification.
  if (user.role === role) {
    return res.status(400).send({
      errors: `user's role is already ${role}`,
    });
  }

  // TODO:
  // set all blackList where user.id === blackList.adminId
  // to blackList.adminId === null.

  try {
    await user.update({ role });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      role: user.role,
      userId,
    },
  });
};
