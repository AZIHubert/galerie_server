// DELETE /invitations/:invitationId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    invitationId,
  } = req.params;
  const currentUser = req.user as User;
  let invitation: Invitation | null;

  // Check if request.params.invitationId is a UUID v4.
  if (!uuidValidatev4(invitationId)) {
    return res.status(400).send({
      errors: INVALID_UUID('invitation'),
    });
  }

  // Fetch invitation.
  try {
    invitation = await Invitation.findByPk(invitationId, {
      include: [
        {
          include: [
            {
              model: User,
              required: true,
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
      ],
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

  // Check if current user is allow
  // to destroy this invitation.
  // Only the creator of the invitation
  // or the admin of galerie is allow
  // to delete the invitation.
  if (
    currentUser.id !== invitation.userId
    && invitation.galerie.users[0].GalerieUser.role !== 'admin'
  ) {
    return res.status(400).send({
      errors: 'you\'re not allow to delete this invitation',
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
      galerieId: invitation.galerieId,
      invitationId: invitation.id,
    },
  });
};
