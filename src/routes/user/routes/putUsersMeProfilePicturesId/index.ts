import { Request, Response } from 'express';

import ProfilePicture from '@src/db/models/profilePicture';

export default async (req: Request, res: Response) => {
  const { user } = res.locals;
  const { id: userId } = user;
  const { id } = req.params;
  let profilePicture: ProfilePicture | null;
  try {
    profilePicture = await ProfilePicture.findOne({
      where: {
        id,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!profilePicture) {
    return res.status(404).send({
      errors: 'profile picture not found',
    });
  }
  if (user.currentProfilePicture === id) {
    try {
      await user.update({ currentProfilePicture: null });
      return res.status(200).send(user);
    } catch (err) {
      return res.status(500).send(err);
    }
  }
  try {
    await user.update({ currentProfilePicture: id });
    return res.status(200).send(user);
  } catch (err) {
    return res.status(500).send(err);
  }
};
