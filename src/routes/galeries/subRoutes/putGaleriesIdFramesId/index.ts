import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Like,
  User,
} from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId, frameId } = req.params;
  let galerie: Galerie | null;
  let frame: Frame | null;
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: userId,
        },
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }
  try {
    frame = await Frame.findOne({
      where: {
        id: frameId,
        galerieId,
      },
      include: [{
        model: GaleriePicture,
      }],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!frame) {
    return res.status(404).send({
      errors: 'frame not found',
    });
  }
  try {
    const like = await Like.findOne({
      where: {
        userId,
        frameId,
      },
    });
    if (like) {
      await like.destroy();
    } else {
      await Like.create({
        userId,
        frameId,
      });
    }
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
