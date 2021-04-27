import { Request, Response } from 'express';

import { User } from '@src/db/models';
import {
  FIELD_IS_REQUIRED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';

export default async (req: Request, res: Response) => {
  const { role } = req.body;
  const { id } = req.params;
  const { id: userId } = req.user as User;
  let user: User | null;

  if (id === userId) {
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

  // Check if user exist
  // and confirmed.
  try {
    user = await User.findOne({
      where: {
        id,
        confirmed: true,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: USER_NOT_FOUND,
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

  try {
    await user.update({ role });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
