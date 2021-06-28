// GET /galeries/:galerieId/frames/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

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
  const {
    galerieId,
  } = req.params;
  const {
    previousFrame,
  } = req.query;
  const limit = 20;
  const currentUser = req.user as User;
  const whereFrame: {
    autoIncrementId?: any
  } = {};
  const whereGalerie: {
    id?: string;
  } = {};
  let frames: Frame[];
  let galerie: Galerie | null;
  let returnedFrames: Array<any>;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  if (currentUser.role === 'user') {
    whereGalerie.id = currentUser.id;
  }

  // Fecth galerie,
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: whereGalerie,
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

  if (previousFrame) {
    whereFrame.autoIncrementId = {
      [Op.lt]: previousFrame,
    };
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
      limit,
      order: [['autoIncrementId', 'DESC']],
      where: {
        ...whereFrame,
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
          const isBlackListed = await checkBlackList(frame.user);
          return {
            ...normalizedFrame,
            liked: !!frame.likes.length,
            likes: undefined,
            user: {
              ...frame.user.toJSON(),
              currentProfilePicture: null,
              isBlackListed,
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
