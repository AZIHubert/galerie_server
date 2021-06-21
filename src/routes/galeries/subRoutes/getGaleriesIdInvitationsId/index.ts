// GET /galeries/:galerieId/invitations/:invitationId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  invitationExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    invitationId,
  } = req.params;
  const currentUser = req.user as User;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let galerie: Galerie | null;
  let invitation: Invitation | null;
  let userIsBlackListed: boolean;

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
      include: [{
        model: User,
        where: {
          id: currentUser.id,
        },
      }],
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

  // Fetch invitation.
  try {
    invitation = await Invitation.findOne({
      attributes: {
        exclude: invitationExcluder,
      },
      include: [{
        model: User,
      }],
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
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if invitation is expired.
  if (invitation.time && invitation.time < new Date(Date.now())) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  if (invitation.numOfInvits !== null && invitation.numOfInvits < 1) {
    try {
      await invitation.destroy();
    } catch (err) {
      return res.status(500).send(err);
    }
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('invitation'),
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(invitation.user);
    userExcluder.forEach((e) => {
      objectUserExcluder[e] = undefined;
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const returnedInvitation = {
    ...invitation.toJSON(),
    user: userIsBlackListed ? null : {
      ...invitation.user.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
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
