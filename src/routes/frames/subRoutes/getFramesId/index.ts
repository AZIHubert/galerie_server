// GET /frames/:frameId/

import { Op } from 'sequelize';

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
  userExcluder,
  frameExcluder,
  galeriePictureExcluder,
} from '#src/helpers/excluders';
import {
  fetchFrame,
} from '#src/helpers/fetch';

import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
  } = req.params;
  const currentUser = req.user as User;
  let frame: Frame | null;
  let returnedFrame;
  let where = {};

  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // If currentUser's role === 'user'
  // and currentUser's role for this galerie === 'user'
  // do not return reported frame.
  if (currentUser.role === 'user') {
    where = {
      [Op.or]: [
        {
          '$galerie.users.role$': {
            [Op.not]: 'user',
          },
        },
        {
          '$galerie.users.GalerieUser.role$': {
            [Op.not]: 'user',
          },
        },
        {
          '$usersReporting.id$': {
            [Op.eq]: null,
          },
        },
      ],
    };
  }

  // Fetch frame.
  try {
    frame = await Frame.findOne({
      attributes: {
        exclude: frameExcluder,
      },
      include: [
        {
          include: [
            {
              model: User,
              // if currentUser role === 'user'
              // currentUser should be subscribe to the galerie.
              required: currentUser.role === 'user',
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
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
          model: Like,
          limit: 1,
          required: false,
          where: {
            userId: currentUser.id,
          },
        },
        {
          as: 'usersReporting',
          duplicating: false,
          model: User,
          required: false,
          where: {
            id: currentUser.id,
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
      subQuery: false,
      where: {
        ...where,
        id: frameId,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }

  // Check if frame exist.
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  try {
    const normalizedFrame = await fetchFrame(frame);

    if (normalizedFrame) {
      const isBlackListed = await checkBlackList(frame.user);
      returnedFrame = {
        ...normalizedFrame,
        galerie: undefined,
        liked: !!frame.likes.length,
        likes: undefined,
        usersReporting: undefined,
        user: {
          ...frame.user.toJSON(),
          isBlackListed,
          currentProfilePicture: null,
        },
      };
    } else {
      await frame.destroy();
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
      galerieId: frame.galerie.id,
    },
  });
};
