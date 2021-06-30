// DELETE /galeries/:galerieId/blackLists/:blackListId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieBlackList,
  GalerieUser,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    blackListId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(blackListId)) {
    return res.status(400).send({
      errors: INVALID_UUID('black list'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          include: [
            {
              as: 'createdBy',
              model: User,
            },
          ],
          limit: 1,
          model: GalerieBlackList,
          required: false,
          where: {
            id: blackListId,
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

  if (!galerie.galerieBlackLists[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('black list'),
    });
  }

  // Check if currentUser
  // is the admin or a moderator
  // of this galerie.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow to delete a black list from this galerie',
    });
  }

  // If current user role for this
  // galerie is not 'admin' and
  // or if current user try to delete
  // a black list not posted by him,
  // Check if the creator of this
  // black list is not the admin
  // of this galerie.
  if (
    (
      !userFromGalerie
      || userFromGalerie.GalerieUser.role !== 'admin'
    )
    || (
      galerie.galerieBlackLists[0].createdById
      && currentUser.id !== galerie.galerieBlackLists[0].createdById
    )
  ) {
    let galerieUser: GalerieUser | null;

    try {
      galerieUser = await GalerieUser.findOne({
        where: {
          galerieId,
          userId: galerie.galerieBlackLists[0].createdById,
        },
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (galerieUser && galerieUser.role === 'admin') {
      return res.status(400).send({
        errors: 'you\'re not allow to delete a black list posted by the admin of this galerie',
      });
    }
  }

  try {
    await galerie.galerieBlackLists[0].destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      blackListId,
      galerieId,
    },
  });
};
