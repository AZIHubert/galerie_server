import { compare } from 'bcrypt';
import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  Like,
  User,
} from '@src/db/models';

import { WRONG_PASSWORD } from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import {
  normalizeJoiErrors,
  validateDeleteGaleriesIdBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { id: galerieId } = req.params;
  const {
    id: userId,
    password,
  } = req.user as User;
  let galerie: Galerie | null;
  let passwordsMatch: boolean;

  // Find galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          where: {
            id: userId,
          },
          model: User,
        },
        {
          include: [{
            include: [{
              all: true,
            }],
            model: GaleriePicture,
          }],
          model: Frame,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!galerie) {
    return res.status(404).send({
      errors: 'galerie not found',
    });
  }

  // Check if user\'s role relative to
  // this galerie is 'creator'.
  const { role } = galerie
    .users
    .filter((user) => user.id === userId)[0]
    .GalerieUser;
  if (role !== 'creator') {
    return res.status(400).send({
      errors: 'not allow to delete this galerie',
    });
  }

  // Check if body have errors.
  const errors: {[key: string]: string} = {};
  const {
    error,
    value,
  } = validateDeleteGaleriesIdBody(req.body);
  if (error) {
    Object
      .keys(normalizeJoiErrors(error))
      .forEach((key) => {
        errors[key] = normalizeJoiErrors(error)[key];
      });
  }
  if (!errors.name && value.name !== galerie.name) {
    errors.name = 'wrong galerie\'s name';
  }
  if (!errors.password) {
    try {
      passwordsMatch = await compare(value.password, password);
    } catch (err) {
      return res.status(500).send(err);
    }
    if (!passwordsMatch) {
      errors.password = WRONG_PASSWORD;
    }
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({ errors });
  }

  try {
    await Promise.all(
      galerie.frames.map(async (frame) => {
        await frame.destroy();

        await Like.destroy({
          where: { frameId: frame.id },
        });

        await Promise.all(
          frame.galeriePictures.map(async (galeriePicture) => {
            await galeriePicture.destroy();
            const {
              originalImage,
              cropedImage,
              pendingImage,
            } = galeriePicture;

            await Image.destroy({
              where: {
                [Op.or]: [
                  {
                    id: cropedImage.id,
                  },
                  {
                    id: originalImage.id,
                  },
                  {
                    id: pendingImage.id,
                  },
                ],
              },
            });

            await gc
              .bucket(originalImage.bucketName)
              .file(originalImage.fileName)
              .delete();
            await gc
              .bucket(cropedImage.bucketName)
              .file(cropedImage.fileName)
              .delete();
            await gc
              .bucket(pendingImage.bucketName)
              .file(pendingImage.fileName)
              .delete();
          }),
        );
      }),
    );

    await Invitation.destroy({
      where: {
        galerieId: galerie.id,
      },
    });

    await GalerieUser.destroy({
      where: {
        galerieId: galerie.id,
      },
    });

    await galerie.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      galerieId: galerie.id,
    },
  });
};
