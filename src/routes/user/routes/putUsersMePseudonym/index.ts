import { Request, Response } from 'express';

import User from '@src/db/models/user';
import {
  validatePseudonym,
  normalizeJoiErrors,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const user = req.user as User;
  let pseudonym: string;
  try {
    const { error, value } = validatePseudonym(req.body);
    if (error) {
      return res.status(400).send({
        errors: normalizeJoiErrors(error),
      });
    }
    await user.update({ pseudonym: value.pseudonym });
    pseudonym = value.pseudonym;
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(200).send({ pseudonym });
};
