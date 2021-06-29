import {
  Request,
  Response,
} from 'express';

import {
  User,
} from '#src/db/models';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;

  try {
    await currentUser.update({
      hasNewNotifications: 0,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(204).end();
};
