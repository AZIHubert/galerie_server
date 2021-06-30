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
  Report,
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
  const where: {
    id?: string
  } = {};
  let frame: Frame | null;
  let returnedFrame;

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
    frame = await Frame.findByPk(frameId, {
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
          model: Like,
          limit: 1,
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
          include: [
            {
              model: User,
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
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          model: User,
        },
      ],
    });
  } catch (err) {
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
        report: undefined,
        reported: !!(frame.report && frame.report.users.length),
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
