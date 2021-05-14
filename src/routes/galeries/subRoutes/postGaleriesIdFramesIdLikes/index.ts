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

export default async (req: Request, res: Response) => {
  const {
    frameId,
    id: galerieId,
  } = req.params;
  const user = req.user as User;
  let frame: Frame | null;
  let galerie: Galerie | null;
  let like: Like | null;

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: user.id,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send('galerie not found');
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
    return res.status(404).send('frame not found');
  }

  // Fetch like.
  try {
    like = await Like.findOne({
      where: {
        frameId,
        userId: user.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // If like exist, destroy it,
  // decrement frame.numOfLike
  if (like) {
    await like.destroy();
    await frame.increment({ numOfLikes: -1 });

  // Else, create one
  // increment frame.numOfLike
  } else {
    await Like.create({
      frameId,
      userId: user.id,
    });
    await frame.increment({ numOfLikes: 1 });
  }

  return res.status(200).send({
    action: 'POST',
    data: {
      frameId,
      galerieId,
      numOfLikes: frame.numOfLikes,
    },
  });
};
