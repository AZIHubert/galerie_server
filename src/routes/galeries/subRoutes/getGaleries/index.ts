// GET /galeries/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Galerie,
  User,
} from '@src/db/models';

import {
  galerieExcluder,
} from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const {
    all,
    previousGalerie,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const whereGalerie: {
    name?: any;
  } = {};
  const whereUser: {
    id?: string;
  } = {};
  let galeries: Galerie[];
  let returnedGaleries: Array<any>;

  if (currentUser.role === 'user' || all !== 'true') {
    whereUser.id = currentUser.id;
  }
  if (previousGalerie) {
    whereGalerie.name = {
      [Op.gt]: previousGalerie.toString(),
    };
  }

  try {
    galeries = await Galerie.findAll({
      attributes: {
        exclude: galerieExcluder,
      },
      include: [{
        model: User,
        where: whereUser,
      }],
      limit,
      order: [['name', 'ASC']],
      where: whereGalerie,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    returnedGaleries = galeries.map((galerie) => {
      const userFromGalerie = galerie.users
        .find((user) => user.id === currentUser.id);

      return {
        ...galerie.toJSON(),
        allowNotification: userFromGalerie
          ? userFromGalerie.GalerieUser.allowNotification
          : null,
        currentCoverPicture: null,
        frames: [],
        hasNewFrames: userFromGalerie
          ? userFromGalerie.GalerieUser.hasNewFrames
          : null,
        role: userFromGalerie
          ? userFromGalerie.GalerieUser.role
          : null,
        users: [],
      };
    });
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
