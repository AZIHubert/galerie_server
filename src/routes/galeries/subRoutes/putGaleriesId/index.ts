import { Request, Response } from 'express';

import {
  Galerie,
  User,
} from '@src/db/models';

import {
  validatePutGaleriesIdBody,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;
  const { id: galerieId } = req.params;
  let galerie: Galerie | null;

  // Find galerie.
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

  // Archived galerie can't by updated.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot update an archived galerie',
    });
  }

  // Only creator or admin are allow to update galerie.
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

  const {
    error,
    value,
  } = validatePutGaleriesIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    await galerie.update(value);
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      id: galerie.id,
      name: galerie.name,
    },
  });
};
