// POST /galeries/:galerieId/invitations/

import {
  Request,
  Response,
} from 'express';
import { customAlphabet } from 'nanoid';

import {
  Galerie,
  Invitation,
  User,
} from '#src/db/models';

import {
  DEFAULT_ERROR_MESSAGE,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  invitationExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import {
  normalizeJoiErrors,
  validatePostGaleriesIdInvationsBody,
} from '#src/helpers/schemas';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

// Recursive function to check if code is unique
const checkIfCodeExis = async (limit: number) => {
  const code = `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`;
  const betaKeyWithCodeExist = await Invitation.findOne({
    where: {
      code,
    },
  });
  if (betaKeyWithCodeExist) {
    if (limit < 15) {
      await checkIfCodeExis(limit + 1);
    } else {
      return false;
    }
  }
  return code;
};

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  const objectInvitationExcluder: { [key:string]: undefined} = {};
  const objectUserExcluder: { [key:string]: undefined} = {};
  let galerie: Galerie | null;
  let invitation: Invitation | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
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

  // Check if current user's role is
  // admin or moderator.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to create an invitation',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostGaleriesIdInvationsBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  const code = await checkIfCodeExis(0);
  if (!code) {
    return res.status(500).send({
      errors: DEFAULT_ERROR_MESSAGE,
    });
  }

  // create invitation.
  try {
    invitation = await Invitation.create({
      code,
      galerieId,
      numOfInvits: value.numOfInvits,
      time: value.time ? new Date(Date.now() + value.time) : null,
      userId: currentUser.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  invitationExcluder.forEach((e) => {
    objectInvitationExcluder[e] = undefined;
  });
  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  // TODO:
  // include invitationToken.
  // { id: invitation.id }

  const returnedInvitation = {
    ...invitation.toJSON(),
    ...objectInvitationExcluder,
    user: {
      ...currentUser.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
      hasNewNotifications: undefined,
    },
  };

  return res.status(200).send({
    action: 'POST',
    data: {
      galerieId,
      invitation: returnedInvitation,
    },
  });
};
