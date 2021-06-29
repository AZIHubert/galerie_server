// GET /users/me/

import {
  Request,
  Response,
} from 'express';

import {
  User,
} from '#src/db/models';

import {
  userExcluder,
} from '#src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const objectUserExcluder: { [key: string]: undefined } = {};

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  // Compose final returned user.
  const returnedUser = {
    ...currentUser.toJSON(),
    ...objectUserExcluder,
    currentProfilePicture: null,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      user: returnedUser,
    },
  });
};
