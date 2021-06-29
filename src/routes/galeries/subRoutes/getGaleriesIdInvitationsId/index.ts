// GET /galeries/:galerieId/invitations/:invitationId/

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
    galerieId,
    invitationId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let isBlackListed: boolean;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.galerieId
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
          attributes: {
            exclude: invitationExcluder,
          },
          include: [{
            attributes: {
              exclude: [
                ...userExcluder,
                'hasNewNotifications',
              ],
            },
            model: User,
          }],
          limit: 1,
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

  // Check if user'role for this galerie
  // is not 'user'.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to fetch the invitation',
    });
  }

  // Check if invitation exist.
  if (!galerie.invitations[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if invitation is expired.
  if (
    (
      galerie.invitations[0].time
      && galerie.invitations[0].time < new Date(Date.now())
    )
    || (
      galerie.invitations[0].numOfInvits !== null
      && galerie.invitations[0].numOfInvits < 1
    )
  ) {
    try {
      await galerie.invitations[0].destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if user is black listed.
  try {
    isBlackListed = await checkBlackList(galerie.invitations[0].user);
  } catch (err) {
    return res.status(500).send(err);
  }

  const returnedInvitation = {
    ...galerie.invitations[0].toJSON(),
    user: {
      ...galerie.invitations[0].user.toJSON(),
      currentProfilePicture: null,
      isBlackListed,
    },
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      invitation: returnedInvitation,
    },
  });
};
