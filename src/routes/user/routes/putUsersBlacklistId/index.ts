import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';
import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validateBlackListUser,
} from '@src/helpers/schemas';

// TODO:
// POST instead of PUT.

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    id: userId,
    role,
  } = req.user as User;
  let user: User | null;
  let blackList: BlackList;

  // You cannot black list yourself.
  if (id === userId) {
    return res.status(401).send({
      errors: 'you can\'t put your account on the black list',
    });
  }

  // Check if user exist and confirmed.
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

  // Check if the role of the user
  // you want to black list is valid.
  if (user.role === 'superAdmin') {
    return res.status(401).send({
      errors: 'you can\'t black listed a super admin',
    });
  }
  if (role === 'admin' && user.role === 'admin') {
    return res.status(401).send({
      errors: 'you can\'t black listed an admin',
    });
  }

  // If blacklist exist, deleted it.

  // if (user.blackListId) {
  //   try {
  //     await BlackList.destroy({
  //       where: {
  //         id: user.blackListId,
  //       },
  //     });
  //     return res.status(204).end();
  //   } catch (err) {
  //     return res.status(500).send(err);
  //   }
  // }

  const {
    error,
    value,
  } = validateBlackListUser(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    blackList = await BlackList.create({
      adminId: userId,
      reason: value.reason,
      time: value.time ? value.time : null,
      userId: id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      blackList: blackList.toJSON(),
    },
  });
};
