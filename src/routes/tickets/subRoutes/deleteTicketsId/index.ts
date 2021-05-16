import { Request, Response } from 'express';

import { Ticket } from '@src/db/models';

export default async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  let ticket: Ticket | null;

  try {
    ticket = await Ticket.findByPk(ticketId);
  } catch (err) {
    return res.status(500).send(err);
  }
  if (!ticket) {
    return res.status(404).send({
      errors: 'ticket not found',
    });
  }

  try {
    await ticket.destroy();
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'DELETE',
    data: {
      ticketId,
    },
  });
};
