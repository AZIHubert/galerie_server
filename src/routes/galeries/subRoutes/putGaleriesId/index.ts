import {
  Request,
  Response,
} from 'express';

import {
  Galerie,
  User,
} from '@src/db/models';

import {
  validatePutGaleriesIdBody,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const { id: userId } = req.user as User;
  let galerie: Galerie | null;

  // Fetch galerie.
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

  // Check if galerie exist.
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
      errors: 'you\'re not allow to update this galerie',
    });
  }

  // Validate request.body.
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
      galerieId: galerie.id,
      name: galerie.name,
    },
  });
};
