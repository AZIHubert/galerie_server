import { Request, Response } from 'express';

import ProfilePicture from '@src/db/models/profilePicture';

export default async (_req: Request, res: Response) => {
  const { user: { id } } = res.locals;
  let profilePictures: ProfilePicture[];
  try {
    profilePictures = await ProfilePicture.findAll({
      where: { userId: id },
      include: [
        {
          all: true,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(profilePictures);
};
