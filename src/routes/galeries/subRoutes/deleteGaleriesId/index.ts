// DELETE /galeries/:galerieId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  User,
} from '#src/db/models';

import {
  WRONG_PASSWORD,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import gc from '#src/helpers/gc';
import {
  normalizeJoiErrors,
  validateDeleteGaleriesIdBody,
} from '#src/helpers/schemas';
import validatePassword from '#src/helpers/validatePassword';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { galerieId } = req.params;
  const currentUser = req.user as User;
  const where: {
    id?: string
  } = {};
  let galerie: Galerie | null;

  // Check if request.params.userId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  if (currentUser.role === 'user') {
    where.id = currentUser.id;
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          where,
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
  // this galerie is 'admin'
  // or currentUser.role === 'user'
  const userFromGalerie = galerie.users
    .find((user) => user.id === currentUser.id);
  if (
    currentUser.role === 'user'
    && (
      !userFromGalerie
      || userFromGalerie.GalerieUser.role !== 'admin'
    )
  ) {
    return res.status(400).send({
      errors: 'not allow to delete this galerie',
    });
  }

  // Check if request.body hasve errors.
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

  // Check if request.body.name have error.
  if (!errors.name && value.name !== galerie.name) {
    errors.name = 'wrong galerie\'s name';
  }
  // Check if request.body.password have error.
  if (!errors.password) {
    const passwordIsValid = validatePassword(value.password, currentUser.hash, currentUser.salt);
    if (!passwordIsValid) {
      errors.password = WRONG_PASSWORD;
    }
  }
  if (Object.keys(errors).length) {
    return res.status(400).send({ errors });
  }

  // Destroy all images from Google Buckets/likes.
  try {
    await Promise.all(
      galerie.frames.map(
        async (frame) => {
          await Promise.all(
            frame.galeriePictures.map(
              async (galeriePicture) => {
                const {
                  originalImage,
                  cropedImage,
                  pendingImage,
                } = galeriePicture;

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
        },
      ),
    );
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
