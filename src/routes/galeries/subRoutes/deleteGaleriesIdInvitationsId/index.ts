import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const {
    galerieId,
    invitationId,
  } = req.params;
  let galerie: Galerie | null;
  let invitation: Invitation | null;

  // Fetch galerie.
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

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if user's role for this galerie
  // is not 'user'.
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'your not allow to delete invitations',
    });
  }

  // Fetch invitation.
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

  // Check if invitation exist.
  if (!invitation) {
    return res.status(404).send({
      errors: 'invitation not found',
    });
  }

  // Destroy invitation.
  try {
    await invitation.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId: galerie.id,
      invitationId: invitation.id,
    },
  });
};
