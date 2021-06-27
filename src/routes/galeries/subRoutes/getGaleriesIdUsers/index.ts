// GET /galeries/:galerieId/users/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Galerie,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  userExcluder,
} from '@src/helpers/excluders';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const {
    direction: queryDirection,
    page,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  let direction = 'ASC';
  let galerie: Galerie | null;
  let offset: number;
  let users: User[] = [];
  let usersWithProfilePicture: Array<any> = [];

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

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }
  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    users = await User.findAll({
      attributes: {
        exclude: [
          ...userExcluder,
          'hasNewNotifications',
        ],
      },
      include: [
        {
          model: Galerie,
          where: {
            id: galerieId,
          },
        },
      ],
      limit,
      offset,
      order: [['pseudonym', direction]],
      where: {
        id: {
          [Op.not]: currentUser.id,
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    usersWithProfilePicture = await Promise.all(
      users.map(async (user) => {
        const isBlackListed = await checkBlackList(user);

        return {
          ...user.toJSON(),
          currentProfilePicture: null,
          galerieRole: user.galeries[0]
            ? user.galeries[0].GalerieUser.role
            : 'user',
          galeries: undefined,
          isBlackListed,
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
      users: usersWithProfilePicture,
    },
  });
};
