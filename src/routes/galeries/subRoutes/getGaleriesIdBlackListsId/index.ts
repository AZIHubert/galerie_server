// GET /galeries/:galerieId/blackLists/:blackListId/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  GalerieBlackList,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  galerieBlackListExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import uuidValidateV4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
    blackListId,
  } = req.params;
  const currentUser = req.user as User;
  let createdByIsBlackListed: boolean = false;
  let galerie: Galerie | null;
  let userIsBlackListed: boolean;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidateV4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidateV4(blackListId)) {
    return res.status(400).send({
      errors: INVALID_UUID('black list'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          model: User,
          where: {
            id: currentUser.id,
          },
        },
        {
          attributes: {
            exclude: galerieBlackListExcluder,
          },
          include: [
            {
              as: 'createdBy',
              attributes: {
                exclude: [
                  ...userExcluder,
                  'hasNewNotifications',
                ],
              },
              model: User,
            },
            {
              as: 'user',
              attributes: {
                exclude: [
                  ...userExcluder,
                  'hasNewNotifications',
                ],
              },
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

  // Check if currentUser
  // is the creator or an admin
  // of this galerie.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow get the black lists from this galerie',
    });
  }

  if (!galerie.galerieBlackLists[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('black list'),
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackListed = await checkBlackList(galerie.galerieBlackLists[0].user);
  } catch (err) {
    return res.status(500).send(err);
  }

  if (galerie.galerieBlackLists[0].createdBy) {
    // Check if createdBy is black listed.
    try {
      createdByIsBlackListed = await checkBlackList(galerie.galerieBlackLists[0].createdBy);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  const normalizeGalerieBlackList = {
    ...galerie.galerieBlackLists[0].toJSON(),
    createdBy: galerie.galerieBlackLists[0].createdBy ? {
      ...galerie.galerieBlackLists[0].createdBy.toJSON(),
      currentProfilePicture: null,
      isBlackListed: createdByIsBlackListed,
    } : null,
    galerie: undefined,
    user: {
      ...galerie.galerieBlackLists[0].user.toJSON(),
      currentProfilePicture: null,
      idBlackListed: userIsBlackListed,
    },
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      blackList: normalizeGalerieBlackList,
      galerieId,
    },
  });
};
