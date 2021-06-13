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
import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  let direction = 'ASC';
  let galerie: Galerie | null;
  let offset: number;
  let order = 'pseudonym';
  let users: User[] = [];
  let usersWithProfilePicture: Array<any> = [];

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }
  if (
    queryOrder === 'pseudonym'
    || queryOrder === 'userName'
  ) {
    order = queryOrder;
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
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

  try {
    users = await User.findAll({
      attributes: {
        exclude: userExcluder,
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
      order: [[order, direction]],
      where: {
        id: {
          [Op.not]: currentUser.id,
        },
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);

  try {
    usersWithProfilePicture = await Promise.all(
      users.map(async (user) => {
        const userIsBlackListed = await checkBlackList(user);
        const currentProfilePicture = await fetchCurrentProfilePicture(user);

        const returnedUser = {
          ...user.toJSON(),
          currentProfilePicture,
          galerieRole: user.galeries[0]
            ? user.galeries[0].GalerieUser.role
            : 'user',
          galeries: undefined,

          // If current user role for this galerie
          // is 'admin' or 'creator' or current user role
          // is 'admin' or 'superAdmin' and this user
          // is black listed, had a field that
          // indicate this user is black listed.
          isBlackListed: userIsBlackListed
        && (
          (
            !userFromGalerie
            || userFromGalerie.GalerieUser.role !== 'user'
          )
          || currentUser.role !== 'user'
        )
            ? true
            : undefined,
        };

        // Push this user if he's not black listed
        // or he's black listed and current user role
        // for this galerie is 'admin' or 'creator'
        // or current user role is 'admin' or 'superAdmin'.
        if (
          (
            userIsBlackListed
        && (
          (
            !userFromGalerie
            || userFromGalerie.GalerieUser.role !== 'user'
          )
          || currentUser.role !== 'user'
        )
          )
      || !userIsBlackListed
        ) {
          return returnedUser;
        }
        return null;
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      users: usersWithProfilePicture.filter((u) => !!u),
    },
  });
};
