// DELETE /galeries/:galerieId/invitations/:invitationId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
  Invitation,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    invitationId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let galerieUser: GalerieUser | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Check if request.params.invitationId
  // is a UUID v4.
  if (!uuidValidatev4(invitationId)) {
    return res.status(400).send({
      errors: INVALID_UUID('invitation'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          model: Invitation,
          required: false,
          where: {
            id: invitationId,
          },
        },
        {
          model: User,
          where: {
            id: currentUser.id,
          },
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Check if invitation exist.
  if (!galerie.invitations[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if user's role for this galerie
  // is not 'user'.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to delete this invitation',
    });
  }

  // Fetch galerieUser for
  // the user who post this invitation.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId: galerie.invitations[0].userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // If this invitation was not posted by
  // the current user but was posted by
  // the creator of this galerie,
  // return an error.
  if (
    galerie.invitations[0].userId !== currentUser.id
    && (
      galerieUser
      && galerieUser.role === 'creator'
    )
  ) {
    return res.status(400).send({
      errors: 'you\'re not allow to delete this invitation',
    });
  }

  // Destroy invitation.
  try {
    await galerie.invitations[0].destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId: galerie.id,
      invitationId: galerie.invitations[0].id,
    },
  });
};
