import { Request, Response } from 'express';

import ProfilePicture from '@src/db/models/profilePicture';
import Image from '@src/db/models/image';

export default async (_req: Request, res: Response) => {
  const { user: { id } } = res.locals;
  let profilePictures: ProfilePicture[];
  try {
    profilePictures = await ProfilePicture.findAll({
      where: { userId: id },
      include: [
        {
          model: Image,
          as: 'originalImage',
        },
        {
          model: Image,
          as: 'cropedImage',
        },
        {
          model: Image,
          as: 'pendingImage',
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send(profilePictures);
};
