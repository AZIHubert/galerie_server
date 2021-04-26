// Check if user with id === req.params.id exist.
// Check if blacklist with userId === user.id exist.
// Delete blacklist.

import {
  Request,
  Response,
} from 'express';

import {
  BlackList,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import { USER_NOT_FOUND } from '@src/helpers/errorMessages';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  let user: User | null;
  let userIsBlackListed: boolean;

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

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(user);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!userIsBlackListed) {
    return res.status(401).send({
      errors: 'user is not black listed',
    });
  }

  // Destroy blacklist.
  try {
    await BlackList.destroy({
      where: {
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
  });
};
