// GET /galeries/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import {
  galerieExcluder,
  galeriePictureExcluder,
} from '@src/helpers/excluders';
import fetchFrame from '@src/helpers/fetchFrame';

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
        let normalizeCurrentCoverPicture;

        // Fetch current cover picture.
        const currentCoverPicture = await Frame.findOne({
          include: [{
            attributes: {
              exclude: galeriePictureExcluder,
            },
            include: [
              {
                as: 'cropedImage',
                model: Image,
              },
              {
                as: 'originalImage',
                model: Image,
              },
              {
                as: 'pendingImage',
                model: Image,
              },
            ],
            model: GaleriePicture,
            where: {
              current: true,
            },
          }],
          where: {
            galerieId: galerie.id,
          },
        });

        // Fetch signed url if galerie have cover picture.
        if (currentCoverPicture) {
          normalizeCurrentCoverPicture = await fetchFrame(currentCoverPicture);
        }

        const userFromGalerie = galerie.users
          .find((user) => user.id === currentUser.id);

        return {
          ...galerie.toJSON(),
          currentCoverPicture: normalizeCurrentCoverPicture
            ? normalizeCurrentCoverPicture.galeriePictures[0]
            : null,
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
    console.log(err);
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      galeries: returnedGaleries,
    },
  });
};
