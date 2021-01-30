import { Request, Response } from 'express';
import socketIo from 'socket.io';

import { User, Ticket } from '@src/db/models';

import {
  normalizeJoiErrors,
  validateTicket,
} from '@src/helpers/schemas';

// eslint-disable-next-line no-unused-vars
export default (_io: socketIo.Server) => async (req: Request, res: Response) => {
  const { error, value } = validateTicket(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }
  const { id: userId } = req.user as User;
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
