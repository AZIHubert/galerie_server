// GET /invitations/:invitationId

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '#src/db/models';

import checkBlackList from '#src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  invitationExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    invitationId,
  } = req.params;
  const currentUser = req.user as User;
  let invitation: Invitation | null;
  let isBlackListed: boolean;

  // Check if request.params.invitationId is a UUIDv4.
  if (!uuidValidatev4(invitationId)) {
    return res.status(400).send({
      errors: INVALID_UUID('invitation'),
    });
  }

  // Fetch invitation.
  try {
    invitation = await Invitation.findByPk(invitationId, {
      attributes: {
        exclude: invitationExcluder,
      },
      include: [
        {
          include: [
            {
              model: User,
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
        {
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          model: User,
        },
      ],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  // Check if invitation exist.
  if (!invitation) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if invitation is expired.
  if (
    (
      invitation.time
      && invitation.time < new Date(Date.now())
    )
    || (
      invitation.numOfInvits !== null
      && invitation.numOfInvits < 1
    )
  ) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if current user is the admin or a moderator of this galerie.
  if (invitation.galerie.users[0].GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to fetch the invitation',
    });
  }

  // Check if user is black listed.
  try {
    isBlackListed = await checkBlackList(invitation.user);
  } catch (err) {
    return res.status(500).send(err);
  }

  // TODO:
  // include invitationToken.
  // { id: invitation.id }

  const returnedInvitation = {
    ...invitation.toJSON(),
    galerie: undefined,
    user: {
      ...invitation.user.toJSON(),
      currentProfilePicture: null,
      isBlackListed,
    },
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId: invitation.galerie.id,
      invitation: returnedInvitation,
    },
  });
};
