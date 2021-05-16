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
import { userExcluder } from '@src/helpers/excluders';
import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  let direction = 'DESC';
  let galerie: Galerie | null;
  let offset: number;
  let order = 'createdAt';
  let users: User[];
  const {
    direction: queryDirection,
    order: queryOrder,
    page,
  } = req.query;
  const usersWithProfilePicture: Array<any> = [];

  if (
    queryDirection === 'ASC'
    || queryDirection === 'DESC'
  ) {
    direction = queryDirection;
  }

  if (
    queryOrder === 'createdAt'
    || queryOrder === 'pseudonym'
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
      errors: 'galerie not found',
    });
  }

  const { role } = galerie
    .users
    .filter((user) => user.id === currentUser.id)[0]
    .GalerieUser;

  // TODO:
  // if queryOrder === 'createdAt',
  // need to fetch instead
  // GalerieUser where galerieId === galerie.id.
  // and order by createdAt

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

  try {
    await Promise.all(
      users.map(async (user) => {
        const userIsBlackListed = await checkBlackList(user);
        const currentProfilePicture = await fetchCurrentProfilePicture(user);

        const returnedUser = {
          ...user.toJSON(),
          currentProfilePicture,
          galerieRole: user.galeries[0].GalerieUser.role,
          galeries: undefined,
          // If current user role for this galerie
          // is 'admin' or 'creator' or current user role
          // is 'admin' or 'superAdmin' and this user
          // is black listed, had a field that
          // indicate this user is black listed.
          isBlackListed: userIsBlackListed
            && (role !== 'user' || currentUser.role !== 'user')
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
            && (role !== 'user' || currentUser.role !== 'user')
          )
          || !userIsBlackListed
        ) {
          usersWithProfilePicture.push(returnedUser);
        }
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
