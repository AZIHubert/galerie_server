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
      errors: 'you cannot change your role yourself',
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
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the creator to update the role of a user',
    });
  }
  let galerieUser: GalerieUser | null;
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId: UId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!galerieUser) {
    return res.status(404).send({
      errors: 'user not found',
    });
  }
  if (galerieUser.role === 'creator') {
    return res.status(400).send({
      errors: 'you can\'t change the role of the creator of this galerie',
    });
  }
  if (
    galerieUser.role === 'admin'
    && role !== 'creator'
  ) {
    return res.status(400).send({
      errors: 'you should be the creator of this galerie to update the role of an admin',
    });
  }
  const updatedRole = galerieUser.role === 'user' ? 'admin' : 'user';
  try {
    await galerieUser.update({
      role: updatedRole,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    id: UId,
    role: updatedRole,
  });
};
