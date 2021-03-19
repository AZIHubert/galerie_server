import { Request, Response } from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  User,
} from '@src/db/models';

import {
  validateUpdateGalerie,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId } = req.params;
  let galerie: Galerie | null;
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [{
        model: User,
        where: {
          id: userId,
        },
      }, {
        model: Frame,
        include: [{
          model: GaleriePicture,
        }],
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
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (
    role === 'user'
  ) {
    return res.status(400).send({
      errors: 'not allow to update this galerie',
    });
  }
  if (!Object.keys(req.body).length) {
    return res.status(400).send({
      errors: 'no changes commited',
    });
  }
  const changes = {} as {
    coverPictureId?: string | null;
    name?: string;
  };
  const {
    coverPictureId,
    name,
  } = req.body;
  if (coverPictureId) {
    const galeriePictureExist = galerie
      .frames
      .map((frame) => frame
        .galeriePictures
        .filter((e) => e.id === coverPictureId).length)
      .reduce((acc, current) => acc + current);
    if (!galeriePictureExist) {
      return res.status(400).send({
        errors: 'picture id doen\'t exist',
      });
    }
    if (galerie.coverPictureId === coverPictureId) {
      changes.coverPictureId = null;
    } else {
      changes.coverPictureId = coverPictureId;
    }
  }
  if (name !== undefined) {
    const { error, value } = validateUpdateGalerie(req.body);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
    changes.name = value.name;
  }
  try {
    await galerie.update(changes);
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
