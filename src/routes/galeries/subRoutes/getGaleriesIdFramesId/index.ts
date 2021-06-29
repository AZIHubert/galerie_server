// GET /galeries/:galerieId/frames/:frameId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Like,
  User,
} from '#src/db/models';

import checkBlackList from '#src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  frameExcluder,
  galeriePictureExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import {
  fetchFrame,
} from '#src/helpers/fetch';

import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  const where: {
    id?: string
  } = {};
  let galerie: Galerie | null;
  let returnedFrame;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  if (currentUser.role === 'user') {
    where.id = currentUser.id;
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          attributes: {
            exclude: frameExcluder,
          },
          include: [
            {
              attributes: {
                exclude: galeriePictureExcluder,
              },
              include: [
                {
                  all: true,
                },
              ],
              model: GaleriePicture,
            },
            {
              limit: 1,
              model: Like,
              required: false,
              where: {
                userId: currentUser.id,
              },
            },
            {
              as: 'user',
              attributes: {
                exclude: [
                  ...userExcluder,
                  'hasNewNotifications',
                ],
              },
              model: User,
            },
          ],
          limit: 1,
          model: Frame,
          required: false,
          where: {
            id: frameId,
          },
        },
        {
          model: User,
          where,
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

  // Check if frame exist.
  if (!galerie.frames[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  try {
    const normalizedFrame = await fetchFrame(galerie.frames[0]);

    if (normalizedFrame) {
      const isBlackListed = await checkBlackList(galerie.frames[0].user);
      returnedFrame = {
        ...normalizedFrame,
        liked: !!galerie.frames[0].likes.length,
        likes: undefined,
        user: {
          ...galerie.frames[0].user.toJSON(),
          isBlackListed,
          currentProfilePicture: null,
        },
      };
    } else {
      await galerie.frames[0].destroy();
      return res.status(404).send({
        errors: MODEL_NOT_FOUND('frame'),
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      frame: returnedFrame,
      galerieId,
    },
  });
};
