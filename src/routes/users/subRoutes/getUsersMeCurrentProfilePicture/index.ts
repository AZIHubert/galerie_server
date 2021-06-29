import {
  Request,
  Response,
} from 'express';

import {
  User,
} from '#src/db/models';
import { fetchCurrentProfilePicture } from '#src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  let currentProfilePicture;

  try {
    currentProfilePicture = await fetchCurrentProfilePicture(currentUser);
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      currentProfilePicture,
    },
  });
};
