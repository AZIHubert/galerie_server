// PUT /galeries/:galerieId/frames/:frameId/galeriePictures/:galeriePictureId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  Galerie,
  GaleriePicture,
  Image,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  galeriePictureExcluder,
  imageExcluder,
} from '#src/helpers/excluders';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galerieId,
    galeriePictureId,
  } = req.params;
  const { id: userId } = req.user as User;
  let galerie: Galerie | null;

  // Check if request.params.galerieId
  // is a UUID v4.
  if (!uuidValidatev4(galerieId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie'),
    });
  }

  // Check if request.params.frameId
  // is a UUID v4.
  if (!uuidValidatev4(frameId)) {
    return res.status(400).send({
      errors: INVALID_UUID('frame'),
    });
  }

  // Check if request.params.galeriePictureId
  // is a UUID v4.
  if (!uuidValidatev4(galeriePictureId)) {
    return res.status(400).send({
      errors: INVALID_UUID('galerie picture'),
    });
  }

  // Fetch galerie.
  try {
    galerie = await Galerie.findByPk(galerieId, {
      include: [
        {
          model: User,
          where: {
            id: userId,
          },
        },
        {
          include: [{
            attributes: {
              exclude: galeriePictureExcluder,
            },
            include: [
              {
                as: 'cropedImage',
                attributes: {
                  exclude: imageExcluder,
                },
                model: Image,
              },
              {
                model: Image,
                as: 'originalImage',
                attributes: {
                  exclude: imageExcluder,
                },
              },
              {
                model: Image,
                as: 'pendingImage',
                attributes: {
                  exclude: imageExcluder,
                },
              },
            ],
            model: GaleriePicture,
          }],
          model: Frame,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if galerie exist
  if (!galerie) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie'),
    });
  }

  // Check if user's role for this galerie
  // is creator or admin.
  const userFromGalerie = galerie.users
    .find((user) => user.id === userId);
  if (!userFromGalerie || userFromGalerie.GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'your\'re not allow to update this frame',
    });
  }

  // Check if galerie is not archived.
  if (galerie.archived) {
    return res.status(400).send({
      errors: 'you cannot update an archived galerie',
    });
  }

  // Check if frame exist.
  const frame = galerie.frames
    .find((f) => String(f.id) === frameId);
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Check if galerie picture exist.
  const galeriePicture = frame.galeriePictures
    .find((gp) => gp.id === galeriePictureId);
  if (!galeriePicture) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie picture'),
    });
  }

  // If galerie picuture with :galeriePictureId
  // is not the current cover picture,
  // set current galerie picture to false if exist.
  if (!galeriePicture.current) {
    const allGaleriePictures: Array<GaleriePicture> = [];

    // Set all galerie pictures into a flat array.
    galerie.frames.forEach((f) => {
      f.galeriePictures.forEach((gp) => {
        allGaleriePictures.push(gp);
      });
    });
    // Check if one galerie picture's coverPicture
    // attribute is true.
    const currentCoverPicture = allGaleriePictures
      .find((gp) => gp.current);
    if (currentCoverPicture) {
      try {
        await currentCoverPicture.update({
          current: false,
        });
      } catch (err) {
        return res.status(500).send(err);
      }
    }
  }

  // Revers galeriePicture.coverPicture boolean value.
  try {
    await galeriePicture.update({
      current: !galeriePicture.current,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      current: galeriePicture.current,
      frameId,
      galerieId,
      galeriePictureId,
    },
  });
};
