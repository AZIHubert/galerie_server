// Get /galeries/:galerieId/blackLists/

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
import {
  fetchCurrentProfilePicture,
} from '@root/src/helpers/fetch';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
  } = req.params;
  const {
    direction: queryDirection,
    page,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let direction = 'DESC';
  let offset: number;
  let galerie: Galerie | null;
  let blackLists: Array<GalerieBlackList>;
  let normalizeBlackLists: Array<any>;

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

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  try {
    blackLists = await GalerieBlackList.findAll({
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
      limit,
      offset,
      order: [['createdAt', direction]],
      where: {
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    normalizeBlackLists = await Promise.all(
      blackLists.map(async (blackList) => {
        const userIsBlackList = await checkBlackList(blackList.user);
        let createdByIsBlackList;
        let createdByCurrentProfilePicture;
        let currentProfilePicture;

        if (!userIsBlackList) {
          currentProfilePicture = await fetchCurrentProfilePicture(blackList.user);
        }
        if (blackList.createdBy) {
          createdByIsBlackList = await checkBlackList(blackList.createdBy);
          if (!createdByIsBlackList) {
            createdByCurrentProfilePicture = await fetchCurrentProfilePicture(blackList.createdBy);
          }
        }

        userExcluder.forEach((e) => {
          objectUserExcluder[e] = undefined;
        });

        return {
          ...blackList.toJSON(),
          createdBy: blackList.createdBy && !createdByIsBlackList ? {
            ...blackList.createdBy.toJSON(),
            ...objectUserExcluder,
            currentProfilePicture: createdByCurrentProfilePicture,
          } : null,
          user: blackList.user && !userIsBlackList ? {
            ...blackList.user.toJSON(),
            ...objectUserExcluder,
            currentProfilePicture,
          } : null,
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      blackLists: normalizeBlackLists,
    },
  });
};
