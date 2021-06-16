// GET /tickets/

import {
  Request,
  Response,
} from 'express';

import {
  Ticket,
  User,
} from '@src/db/models';

import {
  ticketExcluder,
  userExcluder,
} from '@src/helpers/excluders';
import { fetchCurrentProfilePicture } from '@root/src/helpers/fetch';

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const limit = 20;
  let offset: number;
  let returnTickets: Array<any>;
  let tickets: Ticket[];

  if (typeof page === 'string') {
    offset = ((+page || 1) - 1) * limit;
  } else {
    offset = 0;
  }

  try {
    tickets = await Ticket.findAll({
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
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  try {
    returnTickets = await Promise.all(
      tickets.map(async (ticket) => {
        let currentProfilePicture;
        if (ticket.user) {
          currentProfilePicture = await fetchCurrentProfilePicture(ticket.user);
        }
        return {
          ...ticket.toJSON(),
          user: ticket.user ? {
            ...ticket.user.toJSON(),
            currentProfilePicture,
          } : null,
        };
      }),
    );
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'GET',
    data: {
      tickets: returnTickets,
    },
  });
};
