import { Request, Response } from 'express';

import ProfilePicture from '@src/db/models/profilePicture';

export default async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user: { id: userId } } = res.locals;
  let profilePicture: ProfilePicture | null;
  try {
    profilePicture = await ProfilePicture.findOne({
      where: {
        id,
        userId,
      },
      include: [
        {
          all: true,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }
  return res.status(200).send(profilePicture);
};
