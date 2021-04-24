import { Request, Response } from 'express';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, userId: UId } = req.params;
  let galerie: Galerie | null;
  if (userId === UId) {
    return res.status(400).send({
      errors: 'you cannot delete yourself',
    });
  }
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: userId,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  let user: User | null;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the creator to this galerie to delete a user',
    });
  }
  try {
    user = await User.findOne({
      where: {
        id: UId,
      },
      include: [{
        model: Galerie,
        where: {
          id: galerieId,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!user) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }
  const { role: deletedRole } = user
    .galeries
    .filter((g) => g.id === galerieId)[0]
    .GalerieUser;
  if (deletedRole === 'creator') {
    return res.status(400).send({
      errors: 'you can\'t delete the creator of this galerie',
    });
  }
  if (
    deletedRole === 'admin'
    && role !== 'creator'
  ) {
    return res.status(400).send({
      errors: 'you should be the creator of this galerie to delete an admin',
    });
  }
  try {
    await GalerieUser.destroy({
      where: {
        userId: UId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    userId: UId,
    galerieId,
  });
};
