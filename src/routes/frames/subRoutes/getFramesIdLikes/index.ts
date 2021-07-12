// GET /galeries/:galerieId/frames/:frameId/likes/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  Like,
  User,
} from '#src/db/models';

import checkBlackList from '#src/helpers/checkBlackList';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import { userExcluder } from '#src/helpers/excluders';
import isNormalInteger from '#src/helpers/isNormalInteger';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
  } = req.params;
  const {
    previousLike,
  } = req.query;
  const currentUser = req.user as User;
  const limit = 20;
  const where: {
    autoIncrementId?: any;
  } = {};
  let frame: Frame | null;
  let likes: Array<Like>;
  let normalizedLikes: Array<any>;

  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // TODO:
  // check if frame is not reported by currentUser

  // Fetch galerie.
  try {
    frame = await Frame.findByPk(frameId, {
      include: [
        {
          include: [
            {
              model: User,
              required: true,
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  if (previousLike && isNormalInteger(previousLike.toString())) {
    where.autoIncrementId = {
      [Op.lt]: previousLike.toString(),
    };
  }

  // Fetch likes
  try {
    likes = await Like.findAll({
      include: [
        {
          attributes: {
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
          },
          model: User,
          where: {
            id: {
              [Op.not]: currentUser.id,
            },
          },
        },
      ],
      limit,
      order: [['autoIncrementId', 'DESC']],
      where: {
        ...where,
        frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Fetch users profile pictures.
  try {
    normalizedLikes = await Promise.all(
      likes.map(async ({
        autoIncrementId,
        id,
        user,
      }) => {
        const isBlackListed = await checkBlackList(user);

        return {
          autoIncrementId,
          id,
          user: {
            ...user.toJSON(),
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
      galerieId: frame.galerieId,
      frameId,
      likes: normalizedLikes,
    },
  });
};
