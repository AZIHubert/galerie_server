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
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
  } = req.params;
  const currentUser = req.user as User;
  let frame: Frame | null;
  let galerie: Galerie | null;
  let like: Like | null;
  let liked: boolean;

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

  // Fetch Frame.
  try {
    frame = await Frame.findOne({
      where: {
        galerieId,
        id: frameId,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if frame exist
  if (!frame) {
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
  // decrement frame.numOfLike
  if (like) {
    await like.destroy();
    await frame.decrement({ numOfLikes: 1 });
    liked = false;

  // Else, create one
  // increment frame.numOfLike
  } else {
    await Like.create({
      frameId,
      userId: currentUser.id,
    });
    await frame.increment({ numOfLikes: 1 });
    liked = true;
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      frameId,
      galerieId,
      liked,
      numOfLikes: frame.numOfLikes,
    },
  });
};
