// GET /galeries/:galerieId/frames/

import { Includeable, Op } from 'sequelize';

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
  Report,
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
import isNormalInteger from '#src/helpers/isNormalInteger';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    galerieId,
  } = req.params;
  const {
    previousFrame,
  } = req.query;
  const currentUser = req.user as User;
  const include: Includeable[] = [
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
      include: [
        {
          model: User,
          required: false,
          where: {
            id: currentUser.id,
          },
        },
      ],
      model: Report,
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
  ];
  const limit = 20;
  const whereFrame: {
    autoIncrementId?: any;
    '$usersReporting.id$'?: any;
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

  // Allow admin/moderator to access
  // to the galerie even if they're not
  // subscribe to it.
  if (currentUser.role === 'user') {
    whereGalerie.id = currentUser.id;
  }

  // Fecth galerie,
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          model: User,
          where: whereGalerie,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  if (previousFrame && isNormalInteger(previousFrame.toString())) {
    whereFrame.autoIncrementId = {
      [Op.lt]: previousFrame.toString(),
    };
  }

  // Do not include reported coverPicture if
  // currentUser's role is 'user' or
  // currentUser's role for this galerie is 'user'.
  if (galerie.users[0] && galerie.users[0].GalerieUser.role === 'user') {
    include.push({
      as: 'usersReporting',
      duplicating: false,
      model: User,
      required: false,
      where: {
        id: currentUser.id,
      },
    });
    whereFrame['$usersReporting.id$'] = {
      [Op.eq]: null,
    };
  }

  // Fetch all frames relative to this galerie.
  try {
    frames = await Frame.findAll({
      attributes: {
        exclude: frameExcluder,
      },
      include,
      limit,
      order: [['autoIncrementId', 'DESC']],
      subQuery: false,
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

        if (!normalizedFrame) {
          await frame.destroy();
          return null;
        }

        const isBlackListed = await checkBlackList(frame.user);
        return {
          ...normalizedFrame,
          liked: !!frame.likes.length,
          likes: undefined,
          usersReporting: undefined,
          user: {
            ...frame.user.toJSON(),
            currentProfilePicture: null,
            isBlackListed,
          },
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
      frames: returnedFrames,
    },
  });
};
