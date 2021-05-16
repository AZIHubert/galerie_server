import {
  Request,
  Response,
} from 'express';
import { customAlphabet } from 'nanoid';

import {
  Galerie,
  Invitation,
  User,
} from '@src/db/models';

import {
  normalizeJoiErrors,
  validatePostGaleriesIdInvationsBody,
} from '@src/helpers/schemas';
import fetchCurrentProfilePicture from '@root/src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const user = req.user as User;
  let currentProfilePicture;
  let galerie: Galerie | null;
  let invitation: Invitation | null;

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: user.id,
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

  // Check if galerie is not archived.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot post invitation on an archived galerie',
    });
  }

  // Check if current user's role is
  // creator or admin.
  const { role } = galerie
    .users
    .filter((u) => u.id === user.id)[0]
    .GalerieUser;
  if (role === 'user') {
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

  // create invitation.
  try {
    invitation = await Invitation.create({
      ...value,
      userId: user.id,
      galerieId,
      code: `${customAlphabet('1234567890', 4)()}-${customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 10)()}`,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch current profile picture.
  try {
    currentProfilePicture = await fetchCurrentProfilePicture(user);
  } catch (err) {
    return res.status(500).send(err);
  }

  const returnedInvitation = {
    ...invitation.toJSON(),
    galerieId: undefined,
    updatedAt: undefined,
    userId: undefined,
    user: {
      ...user.toJSON(),
      authTokenVersion: undefined,
      confirmed: undefined,
      confirmTokenVersion: undefined,
      createdAt: undefined,
      currentProfilePicture,
      email: undefined,
      emailTokenVersion: undefined,
      facebookId: undefined,
      googleId: undefined,
      password: undefined,
      resetPasswordTokenVersion: undefined,
      updatedAt: undefined,
      updatedEmailTokenVersion: undefined,
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
