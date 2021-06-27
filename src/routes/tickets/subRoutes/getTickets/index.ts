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

export default async (req: Request, res: Response) => {
  const { page } = req.query;
  const limit = 20;
  let offset: number;
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
            exclude: [
              ...userExcluder,
              'hasNewNotifications',
            ],
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

  const returnTickets = tickets.map((ticket) => ({
    ...ticket.toJSON(),
    user: ticket.user ? {
      ...ticket.user.toJSON(),
      currentProfilePicture: null,
    } : null,
  }));

  return res.status(200).send({
    action: 'GET',
    data: {
      tickets: returnTickets,
    },
  });
};
