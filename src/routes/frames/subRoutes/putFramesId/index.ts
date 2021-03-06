// PUT /galeries/:galerieId/frames/:frameId/

import {
  Request,
  Response,
} from 'express';

import {
  Frame,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import {
  normalizeJoiErrors,
  validatePutGaleriesIdFramesIdBody,
} from '#src/helpers/schemas';
import uuidValidatev4 from '#src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const {
    frameId,
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

  // Fetch galerie.
  try {
    frame = await Frame.findByPk(frameId, {});
  } catch (err) {
    return res.status(500).send(err);
  }
  // Check if frame exist
  if (!frame) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('frame'),
    });
  }

  // Check if current user have posted
  // this frame.
  if (frame.userId !== currentUser.id) {
    return res.status(400).send({
      errors: 'you can\'t modify this frame',
    });
  }

  // Validate request.body.
  const {
    error,
    value,
  } = validatePutGaleriesIdFramesIdBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Check if requested changes are not the same
  // has actual galerie's fields.
  if (value.description === frame.description) {
    return res.status(400).send({
      errors: 'no change submited',
    });
  }

  // update frame.description.
  try {
    await frame.update(value);
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      description: value.description,
      frameId,
      galerieId: frame.galerieId,
    },
  });
};
