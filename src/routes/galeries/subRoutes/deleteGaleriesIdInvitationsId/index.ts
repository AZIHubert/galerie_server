import { Request, Response } from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, invitationId } = req.params;
  let galerie: Galerie | null;
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
      errors: 'not allow to delete invitations',
    });
  }
  let invitation: Invitation | null;
  try {
    invitation = await Invitation.findOne({
      where: {
        id: invitationId,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!invitation) {
    return res.status(404).send({
      errors: 'invitation not found',
    });
  }
  try {
    await invitation.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    id: invitationId,
  });
};
