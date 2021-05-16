import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  Like,
  User,
} from '@src/db/models';

import fetchCurrentProfilePicture from '@src/helpers/fetchCurrentProfilePicture';
import { userExcluder } from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const limit = 20;
  const { page } = req.query;
  const user = req.user as User;
  const usersWithProfilePicture: Array<any> = [];
  let frame: Frame | null;
  let galerie: Galerie | null;
  let likes: Array<Like>;
  let offset: number;

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
          id: user.id,
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

  // Fetch Frame.
  try {
    frame = await Frame.findOne({
      where: {
        galerieId,
        id: frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }

  // Fetch likes
  try {
    likes = await Like.findAll({
      include: [
        {
          attributes: {
            exclude: userExcluder,
          },
          model: User,
          where: {
            id: {
              [Op.not]: user.id,
            },
          },
        },
      ],
      limit,
      offset,
      order: [
        ['createdAt', 'DESC'],
      ],
      where: {
        frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch users profile pictures.
  try {
    await Promise.all(
      likes.map(async (like) => {
        const currentProfilePicture = await fetchCurrentProfilePicture(like.user);

        const returnedUser = {
          ...like.user.toJSON(),
          currentProfilePicture,
        };

        usersWithProfilePicture.push(returnedUser);
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galerieId,
      frameId,
      users: usersWithProfilePicture,
    },
  });
};
