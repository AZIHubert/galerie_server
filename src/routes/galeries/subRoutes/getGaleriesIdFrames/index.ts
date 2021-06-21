// GET /galeries/:galerieId/frames/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  Like,
  User,
} from '@src/db/models';

import checkBlackList from '@src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  frameExcluder,
  galeriePictureExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import {
  fetchFrame,
} from '@root/src/helpers/fetch';

import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const limit = 20;
  const { page } = req.query;
  const currentUser = req.user as User;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let frames: Frame[];
  let galerie: Galerie | null;
  let offset: number;
  let returnedFrames: Array<any>;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Fecth galerie,
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
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Fetch all frames relative to this galerie.
  try {
    frames = await Frame.findAll({
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
        },
        {
          model: Like,
          required: false,
          where: {
            userId: currentUser.id,
          },
        },
        {
          as: 'user',
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        galerieId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    returnedFrames = await Promise.all(
      frames.map(async (frame) => {
        const normalizedFrame = await fetchFrame(frame);

        if (normalizedFrame) {
          const userIsBlackListed = await checkBlackList(frame.user);
          if (!userIsBlackListed) {
            userExcluder.forEach((e) => {
              objectUserExcluder[e] = undefined;
            });
          }
          return {
            ...normalizedFrame,
            liked: !!frame.likes.length,
            likes: undefined,
            user: userIsBlackListed ? null : {
              ...frame.user.toJSON(),
              ...objectUserExcluder,
              currentProfilePicture: null,
            },
          };
        }
        await frame.destroy();
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
      frames: returnedFrames,
    },
  });
};
