// DELETE /tickets/:ticketId/

import {
  Request,
  Response,
} from 'express';

import { Ticket } from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  let ticket: Ticket | null;

  // Check if request.params.blackListId
  // is a UUID v4.
  if (!uuidValidatev4(ticketId)) {
    return res.status(400).send({
      errors: INVALID_UUID('ticket'),
    });
  }

  // Fetch ticket.
  try {
    ticket = await Ticket.findByPk(ticketId);
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if ticket exist.
  if (!ticket) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('ticket'),
    });
  }

  // Destroy ticket.
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
