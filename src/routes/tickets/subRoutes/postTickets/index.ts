import { Request, Response } from 'express';

import { User, Ticket } from '@src/db/models';

import {
  normalizeJoiErrors,
  validatePostTicketBody,
} from '@src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const { id: userId } = req.user as User;

  const {
    error,
    value,
  } = validatePostTicketBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  try {
    await Ticket.create({
      ...value,
      userId,
    });
  } catch (err) {
    return res.status(500).send(err);
  }
  return res.status(204).end();
};
