// GET /galeries/:galerieId/frames/:frameId/

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
  const {
    frameId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  const objectUserExcluder: { [key: string]: undefined } = {};
  let frame: Frame | null;
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

  // Fetch galerie.
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

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Fectch frame.
  try {
    frame = await Frame.findOne({
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
          model: User,
          as: 'user',
        },
      ],
      where: {
        galerieId,
        id: frameId,
      },
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
      const userIsBlackListed = await checkBlackList(frame.user);
      if (!userIsBlackListed) {
        userExcluder.forEach((e) => {
          objectUserExcluder[e] = undefined;
        });
      }
      returnedFrame = {
        ...normalizedFrame,
        liked: !!frame.likes.length,
        likes: undefined,
        user: userIsBlackListed ? null : {
          ...frame.user.toJSON(),
          ...objectUserExcluder,
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
      galerieId,
    },
  });
};
