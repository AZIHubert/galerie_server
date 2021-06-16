// GET /galeries/

import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  User,
} from '@src/db/models';

import {
  galerieExcluder,
} from '@src/helpers/excluders';
import { fetchCoverPicture } from '@src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;
  const limit = 20;
  const { page } = req.query;
  let galeries: Galerie[];
  let offset: number;
  let returnedGaleries: Array<any>;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    galeries = await Galerie.findAll({
      attributes: {
        exclude: galerieExcluder,
      },
      include: [{
        model: User,
        where: {
          id: currentUser.id,
        },
      }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    returnedGaleries = await Promise.all(
      galeries.map(async (galerie) => {
        const coverPicture = await fetchCoverPicture(galerie);

        const userFromGalerie = galerie.users
          .find((user) => user.id === currentUser.id);

        return {
          ...galerie.toJSON(),
          currentCoverPicture: coverPicture,
          frames: [],
          hasNewFrames: userFromGalerie
            ? userFromGalerie.GalerieUser.hasNewFrames
            : false,
          role: userFromGalerie
            ? userFromGalerie.GalerieUser.role
            : 'user',
          users: [],
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galeries: returnedGaleries,
    },
  });
};
