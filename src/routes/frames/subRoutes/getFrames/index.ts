// GET /frames/

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
  Report,
  User,
} from '#src/db/models';

import checkBlackList from '#src/helpers/checkBlackList';
import {
  frameExcluder,
  galeriePictureExcluder,
  userExcluder,
} from '#src/helpers/excluders';
import {
  fetchFrame,
} from '#src/helpers/fetch';
import isNormalInteger from '#src/helpers/isNormalInteger';

export default async (req: Request, res: Response) => {
  const {
    previousFrame,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  let frames: Array<Frame>;
  let galeries: Array<Galerie>;
  let returnedFrames: Array<any>;
  const where: {
    autoIncrementId?: any;
  } = {};

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

  if (previousFrame && isNormalInteger(previousFrame.toString())) {
    where.autoIncrementId = {
      [Op.lt]: previousFrame.toString(),
    };
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
        ...where,
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
            report: undefined,
            reported: !!(frame.report && frame.report.users.length),
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

  return res.status(200).send({
    action: 'GET',
    data: {
      frames: returnedFrames,
    },
  });
};
