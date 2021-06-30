// PUT /galeries/:galerieId/users/:userId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import { signNotificationToken } from '#src/helpers/issueJWT';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    userId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let galerieUser: GalerieUser | null;
  let notificationToken;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(userId)) {
    return res.status(400).send({
      errors: INVALID_UUID('user'),
    });
  }

  // Current user cannot update
  // his role himself.
  if (userId === currentUser.id) {
    return res.status(400).send({
      errors: 'you cannot change your role yourself',
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

  // Check if current user role for this galerie
  // is admin or moderator.
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the moderator to update the role of a user',
    });
  }

  // Fetch galerieUser.
  try {
    galerieUser = await GalerieUser.findOne({
      where: {
        galerieId,
        userId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerieUser exist.
  if (!galerieUser) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('user'),
    });
  }

  // The admin's role cannot change.
  if (galerieUser.role === 'admin') {
    return res.status(400).send({
      errors: 'you can\'t change the role of the admin of this galerie',
    });
  }

  // Only the admin of this galerie
  // can update the role of an moderator.
  if (
    galerieUser.role === 'moderator'
    && userFromGalerie.GalerieUser.role !== 'admin'
  ) {
    return res.status(400).send({
      errors: 'you should be the admin of this galerie to update the role of a moderator',
    });
  }

  // If user's role with :userId is 'moderator',
  // his new role become 'user'.
  // If user's role with :userId is 'user',
  // his new role become 'moderator'.
  try {
    await galerieUser.update({
      role: galerieUser.role === 'user' ? 'moderator' : 'user',
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (galerieUser.role !== 'user') {
    const signToken = signNotificationToken('GALERIE_ROLE_CHANGE', {
      galerieId,
      role: galerieUser.role,
      userId,
    });
    notificationToken = signToken.token;
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      galerieId,
      notificationToken,
      role: galerieUser.role,
      userId,
    },
  });
};
