import { Request, Response } from 'express';

import {
  Invitation,
  GalerieUser,
  Galerie,
  User,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { code } = req.params;
  let invitation: Invitation | null;
  try {
    invitation = await Invitation.findOne({
      where: {
        code,
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
    const galerie = await Galerie.findByPk(invitation.galerieId);
    if (!galerie) {
      await invitation.destroy();
      return res.status(400).send({
        errors: 'this invitation is not valid',
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  let galerieUser: GalerieUser | null;
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId: invitation.galerieId,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (galerieUser) {
    return res.status(400).send({
      errors: 'you are already subscribe to this galerie',
    });
  }
  if (invitation.numOfInvit !== null && invitation.numOfInvit < 1) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(400).send({
      errors: 'this invitation is not valid',
    });
  }
  const { createdAt, time } = invitation;
  if (time) {
    const dateCreatedAt = new Date(createdAt);
    const today = new Date().getTime();
    const createdAtPlusTime = dateCreatedAt.getTime() + time;
    if (today < createdAtPlusTime) {
      try {
        await invitation.destroy();
      } catch (err) {
        return res.status(500).send(err);
      }
      return res.status(400).send({
        errors: 'this invitation is not valid',
      });
    }
  }

  try {
    if (invitation.numOfInvit) {
      await invitation.decrement({ numOfInvit: 1 });
      if (invitation.numOfInvit - 1 < 1) {
        await invitation.destroy();
      }
    }
    await GalerieUser.create({
      userId,
      galerieId: invitation.galerieId,
      role: 'user',
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({
    id: invitation.galerieId,
  });
};
