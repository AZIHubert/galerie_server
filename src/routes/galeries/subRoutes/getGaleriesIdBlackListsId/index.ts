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
  const objectUserExcluder: { [key: string]: undefined } = {};
  let createdByIsBlackList: boolean = false;
  let galerie: Galerie | null;
  let galerieBlackList: GalerieBlackList | null;
  let userIsBlackList: boolean;

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

  try {
    galerieBlackList = await GalerieBlackList.findByPk(blackListId, {
      attributes: {
        exclude: galerieBlackListExcluder,
      },
      include: [
        {
          model: Galerie,
          where: {
            id: galerieId,
          },
        },
        {
          as: 'createdBy',
          model: User,
        },
        {
          as: 'user',
          model: User,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!galerieBlackList) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('black list'),
    });
  }

  // Check if user is black listed.
  try {
    userIsBlackList = await checkBlackList(galerieBlackList.user);
  } catch (err) {
    return res.status(500).send(err);
  }

  if (galerieBlackList.createdBy) {
    // Check if createdBy is black listed.
    try {
      createdByIsBlackList = await checkBlackList(galerieBlackList.createdBy);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  userExcluder.forEach((e) => {
    objectUserExcluder[e] = undefined;
  });

  const normalizeGalerieBlackList = {
    ...galerieBlackList.toJSON(),
    createdBy: galerieBlackList.createdBy && !createdByIsBlackList ? {
      ...galerieBlackList.createdBy.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
    } : null,
    galerie: undefined,
    user: galerieBlackList.user && !userIsBlackList ? {
      ...galerieBlackList.user.toJSON(),
      ...objectUserExcluder,
      currentProfilePicture: null,
    } : null,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      blackList: normalizeGalerieBlackList,
      galerieId,
    },
  });
};
