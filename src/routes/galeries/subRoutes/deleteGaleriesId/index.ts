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

import {
  WRONG_PASSWORD,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import {
  normalizeJoiErrors,
  validateDeleteGaleriesIdBody,
} from '@src/helpers/schemas';
import validatePassword from '@src/helpers/validatePassword';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  let galerie: Galerie | null;

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          where: {
            id: currentUser.id,
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

  // Check if galerie exist.
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Check if user\'s role relative to
  // this galerie is 'creator'.
  const { role } = galerie
    .users
    .filter((user) => user.id === currentUser.id)[0]
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
    const passwordIsValid = validatePassword(value.password, currentUser.hash, currentUser.salt);
    if (!passwordIsValid) {
      errors.password = WRONG_PASSWORD;
    }
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({ errors });
  }

  // Destroy all frames/galerieImages/images
  // /images from Google Buckets/likes.
  try {
    await Promise.all(
      galerie.frames.map(async (frame) => {
        await frame.destroy();

        await Like.destroy({
          where: { frameId: frame.id },
        });

        await Promise.all(
          frame.galeriePictures.map(
            async (galeriePicture) => {
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
            },
          ),
        );
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all invitations.
  try {
    await Invitation.destroy({
      where: {
        galerieId: galerie.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy all galerieUsers.
  try {
    await GalerieUser.destroy({
      where: {
        galerieId: galerie.id,
      },
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Destroy galerie.
  try {
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
