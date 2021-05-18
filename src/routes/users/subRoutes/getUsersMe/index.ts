import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let currentProfilePicture;

  // fetch current profile picture
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  // Compose final returned user.
  const returnedUser = {
    ...currentUser.toJSON(),
    ...objectUserExcluder,
    currentProfilePicture,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      user: returnedUser,
    },
  });
};
