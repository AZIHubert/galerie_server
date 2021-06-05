// PUT /galeries/:galerieId/users/:userId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieUser,
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
    userId,
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
  // is 'creator' or 'admin'.
  const { role } = galerie
    .users
    .filter((user) => user.id === currentUser.id)[0]
    .GalerieUser;
  if (role === 'user') {
    return res.status(400).send({
      errors: 'you should be an admin or the creator to update the role of a user',
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

  // The creator's role cannot change.
  if (galerieUser.role === 'creator') {
    return res.status(400).send({
      errors: 'you can\'t change the role of the creator of this galerie',
    });
  }

  // Only the creator of this galerie
  // can update the role of an admin.
  if (
    galerieUser.role === 'admin'
    && role !== 'creator'
  ) {
    return res.status(400).send({
      errors: 'you should be the creator of this galerie to update the role of an admin',
    });
  }

  // If user's role with :userId is 'admin',
  // his new role become 'user'.
  // If user's role with :userId is 'user',
  // his new role become 'admin'.
  try {
    await galerieUser.update({
      role: galerieUser.role === 'user' ? 'admin' : 'user',
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      galerieId,
      role: galerieUser.role,
      userId,
    },
  });
};
