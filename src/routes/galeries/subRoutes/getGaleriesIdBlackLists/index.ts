// Get /galeries/:galerieId/blackLists/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Galerie,
  GalerieBlackList,
  User,
} from '#src/db/models';

import checkBlackList from '#src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  galerieBlackListExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';
import isNormalInteger from '#src/helpers/isNormalInteger';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
  } = req.params;
  const {
    previousBlackList,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const where: {
    autoIncrementId?: any;
  } = {};
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
  // is the admin or an moderator
  // of this galerie.
  const userFromGalerie = galerie.users
    .find((u) => u.id === currentUser.id);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'you\'re not allow get the black lists from this galerie',
    });
  }

  if (previousBlackList && isNormalInteger(previousBlackList.toString())) {
    where.autoIncrementId = {
      [Op.lt]: previousBlackList.toString(),
    };
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
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          as: 'createdBy',
          model: User,
        },
        {
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          as: 'user',
          model: User,
        },
      ],
      limit,
      order: [['autoIncrementId', 'DESC']],
      where: {
        ...where,
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    normalizeBlackLists = await Promise.all(
      blackLists.map(async (blackList) => {
        let createdByIsBlackListed;
        const userIsBlackListed = await checkBlackList(blackList.user);
        if (blackList.createdBy) {
          createdByIsBlackListed = await checkBlackList(blackList.createdBy);
        }

        return {
          ...blackList.toJSON(),
          createdBy: blackList.createdBy ? {
            ...blackList.createdBy.toJSON(),
            currentProfilePicture: null,
            isBlackListed: createdByIsBlackListed,
          } : null,
          user: {
            ...blackList.user.toJSON(),
            currentProfilePicture: null,
            isBlackListed: userIsBlackListed,
          },
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
