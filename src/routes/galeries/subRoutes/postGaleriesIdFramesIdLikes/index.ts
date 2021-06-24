// POST /galeries/:galerieId/frames/:frameId/likes/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  Like,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import { signNotificationToken } from '@src/helpers/issueJWT';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;
  let like: Like | null;
  let liked: boolean;
  let notificationToken;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }
  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          limit: 1,
          model: Frame,
          required: false,
          where: {
            id: frameId,
          },
        },
        {
          model: User,
          where: {
            id: currentUser.id,
          },
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

  // Check if frame exist
  if (!galerie.frames[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Fetch like.
  try {
    like = await Like.findOne({
      where: {
        frameId,
        userId: currentUser.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // If like exist, destroy it,
  // decrement frame.numOfLike...
  if (like) {
    await like.destroy();
    await galerie.frames[0].decrement({ numOfLikes: 1 });
    liked = false;
  // ...else, create a Like,
  // increment frame.numOfLike
  // and create notificationToken.
  } else {
    const { id: likeId } = await Like.create({
      frameId,
      userId: currentUser.id,
    });
    await galerie.frames[0].increment({ numOfLikes: 1 });
    liked = true;
    if (galerie.frames[0].userId !== currentUser.id) {
      const signToken = signNotificationToken('FRAME_LIKED', {
        likeId,
      });
      notificationToken = signToken.token;
    }
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      frameId,
      galerieId,
      liked,
      notificationToken,
      numOfLikes: galerie.frames[0].numOfLikes,
    },
  });
};
