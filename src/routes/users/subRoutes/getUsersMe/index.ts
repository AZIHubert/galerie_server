import {
  Request,
  Response,
} from 'express';

import { User } from '@src/db/models';

import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  let currentProfilePicture;

  // fetch current profile picture
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Compose final returned user.
  const userWithProfilePicture = {
    ...currentUser.toJSON(),
    authTokenVersion: undefined,
    confirmed: undefined,
    confirmTokenVersion: undefined,
    currentProfilePicture,
    email: undefined,
    emailTokenVersion: undefined,
    facebookId: undefined,
    googleId: undefined,
    password: undefined,
    resetPasswordTokenVersion: undefined,
    updatedAt: undefined,
    updatedEmailTokenVersion: undefined,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      user: userWithProfilePicture,
    },
  });
};
