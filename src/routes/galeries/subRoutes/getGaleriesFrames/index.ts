// GET /galeries/frames/

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
  frameExcluder,
  galeriePictureExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import {
  fetchFrame,
} from '@src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const limit = 20;
  const { page } = req.query;
  const currentUser = req.user as User;
  let frames: Array<Frame>;
  let galeries: Array<Galerie>;
  let offset: number;
  let returnedFrames: Array<any>;

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  // Fetch all galeries where
  // current user is subscribe.
  try {
    galeries = await Galerie.findAll({
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

  // If current user is
  // not subscribe to any galerie,
  // there is no need to continue.
  if (galeries.length === 0) {
    return res.status(200).send({
      action: 'GET',
      data: {
        frames: [],
      },
    });
  }

  // Map galeries to an array of id.
  const galeriesId = galeries.map((galerie) => galerie.id);

  // Fetch all frames
  // of every galeries.
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
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      where: {
        galerieId: galeriesId,
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
              isBlackListed,
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

  // TODO:
  // should create token
  // notification can only be created
  // with token.
  return res.status(200).send({
    action: 'GET',
    data: {
      frames: returnedFrames,
    },
  });
};
