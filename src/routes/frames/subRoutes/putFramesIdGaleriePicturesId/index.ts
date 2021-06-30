// PUT /frames/:frameId/galeriePictures/:galeriePictureId/

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
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
    galeriePictureId,
  } = req.params;
  const currentUser = req.user as User;
  let frame: Frame | null;

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
    frame = await Frame.findByPk(frameId, {
      include: [
        {
          model: GaleriePicture,
          required: false,
          where: {
            id: galeriePictureId,
          },
        },
        {
          include: [
            {
              model: User,
              required: true,
              where: {
                id: currentUser.id,
              },
            },
          ],
          required: true,
          model: Galerie,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Check if user's role for this galerie
  // is admin or moderator.
  if (frame.galerie.users[0].GalerieUser.role === 'user') {
    return res.status(400).send({
      errors: 'your\'re not allow to update this frame',
    });
  }

  // Check if galerie picture exist.
  if (!frame.galeriePictures[0]) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('galerie picture'),
    });
  }

  // If galerie picuture with :galeriePictureId
  // is not the current cover picture,
  // set current galerie picture to false if exist.
  if (!frame.galeriePictures[0].current) {
    let current;

    // Set all galerie pictures into a flat array.
    try {
      current = await Galerie.findByPk(frame.galerieId, {
        include: [
          {
            include: [
              {
                model: GaleriePicture,
                required: true,
                where: {
                  current: true,
                },
              },
            ],
            required: true,
            model: Frame,
          },
        ],
      });
    } catch (err) {
      return res.status(500).send(err);
    }
    if (current) {
      await current.frames[0].galeriePictures[0].update({
        current: false,
      });
    }
  }

  // Revers galeriePicture.coverPicture boolean value.
  try {
    await frame.galeriePictures[0].update({
      current: !frame.galeriePictures[0].current,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      current: frame.galeriePictures[0].current,
      frameId,
      galerieId: frame.galerieId,
      galeriePictureId,
    },
  });
};
