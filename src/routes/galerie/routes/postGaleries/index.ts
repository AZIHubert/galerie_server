import { Request, Response } from 'express';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';
import {
  validateGalerie,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { error, value } = validateGalerie(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  const user = req.user as User;
  let galerie: Galerie;
  try {
    galerie = await Galerie.create(value);
    const gu = {
      userId: user.id,
      galerieId: galerie.id,
      role: 'creator',
    };
    await GalerieUser.create(gu);
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
  return res.status(200).send(galerie);
};
