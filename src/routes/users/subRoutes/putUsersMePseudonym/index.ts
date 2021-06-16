import {
  Request,
  Response,
} from 'express';

import {
  User,
} from '@src/db/models';

import {
  normalizeJoiErrors,
  validatePutUsersMePseudonymBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const user = req.user as User;

  // Validate request.body.
  const {
    error,
    value,
  } = validatePutUsersMePseudonymBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Update pseudonym.
  try {
    await user.update({ pseudonym: value.pseudonym });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'PUT',
    data: {
      pseudonym: value.pseudonym,
    },
  });
};
