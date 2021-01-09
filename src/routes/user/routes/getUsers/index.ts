import { Request, Response } from 'express';

import User from '@src/db/models/user';

export default async (__: Request, res: Response) => {
  let users: User[];
  try {
    users = await User.findAll();
  } catch (err) {
    return res.status(500).send(err);
  }
  // TODO: send only relevent datas
  return res.status(200).send(users);
};
