import { Request, Response } from 'express';

import User from '@src/db/models/user';

export default async (__: Request, res: Response) => {
  try {
    const users = await User.findAll();
    return res.status(200).send(users);
  } catch (err) {
    return res.status(500).send({
      errors: 'Something went wrong.',
    });
  }
};
