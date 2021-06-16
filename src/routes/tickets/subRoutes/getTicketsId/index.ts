// GET /tickets/:ticketId/

import {
  Request,
  Response,
} from 'express';

import {
  Ticket,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import {
  ticketExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import { fetchCurrentProfilePicture } from '@root/src/helpers/fetch';
import uuidValidatev4 from '@src/helpers/uuidValidateV4';

export default async (req: Request, res: Response) => {
  const { ticketId } = req.params;
  let currentProfilePicture;
  let returnedTicket = {};
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
    ticket = await Ticket.findByPk(ticketId, {
      attributes: {
        exclude: ticketExcluder,
      },
      include: [
        {
          as: 'user',
          attributes: {
            exclude: userExcluder,
          },
          model: User,
        },
      ],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  // Check if ticket exist.
  if (!ticket) {
    return res.status(404).send({
      errors: MODEL_NOT_FOUND('ticket'),
    });
  }

  // Fetch current profile picture.
  if (ticket.user) {
    try {
      currentProfilePicture = await fetchCurrentProfilePicture(ticket.user);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  // Compose returnedTicket.
  returnedTicket = {
    ...ticket.toJSON(),
    user: ticket.user ? {
      ...ticket.user.toJSON(),
      currentProfilePicture,
    } : null,
  };

  return res.status(200).send({
    action: 'GET',
    data: {
      ticket: returnedTicket,
    },
  });
};
