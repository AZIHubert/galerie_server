// POST /galeries/subscribe/

import {
  Request,
  Response,
} from 'express';

import {
  Invitation,
  GalerieUser,
  Galerie,
  User,
} from '@src/db/models';

import {
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePostGaleriesSubscribeBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let galerieUser: GalerieUser | null;
  let invitation: Invitation | null;

  // Validate body.
  const {
    error,
    value,
  } = validatePostGaleriesSubscribeBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Fetch invitation.
  try {
    invitation = await Invitation.findOne({
      where: {
        code: value.code,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if invitation exist.
  if (!invitation) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(invitation.galerieId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist and it's not archived.
  if (!galerie || galerie.archived) {
    await invitation.destroy();
    return res.status(400).send({
      errors: 'this invitation is not valid',
    });
  }

  // Check if user is not already
  // subscribe to this galerie.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId: invitation.galerieId,
        userId: currentUser.id,
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

  // Check if invitation's numOfInvits is not null and valid.
  // If it's not valid, destroy the invitation.
  if (invitation.numOfInvits !== null && invitation.numOfInvits < 1) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(400).send({
      errors: 'this invitation is not valid',
    });
  }

  // Check if invitation's time is not null and valid.
  // If it's not valid, destroy the invitation.
  if (invitation.time && invitation.time < new Date(Date.now())) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(400).send({
      errors: 'this invitation is not valid',
    });
  }

  // Create GalerieUser.
  try {
    await GalerieUser.create({
      userId: currentUser.id,
      galerieId: invitation.galerieId,
      role: 'user',
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // If invitation's numOfInvits is not null,
  // descrement numOfInvits and destroy invitation
  // if numOfInvits < 1.
  try {
    if (invitation.numOfInvits) {
      await invitation.decrement({ numOfInvits: 1 });
      if (invitation.numOfInvits < 1) {
        await invitation.destroy();
      }
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieId: galerie.id,
    },
  });
};
