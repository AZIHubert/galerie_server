// GET /tickets/

import {
  Request,
  Response,
} from 'express';
import { Op } from 'sequelize';

import {
  Ticket,
  User,
} from '@src/db/models';

import {
  ticketExcluder,
  userExcluder,
} from '@src/helpers/excluders';

export default async (req: Request, res: Response) => {
  const {
    previousTicket,
  } = req.query;
  const limit = 20;
  const where: {
    autoIncrementId?: any;
  } = {};
  let tickets: Ticket[];

  if (previousTicket) {
    where.autoIncrementId = {
      [Op.lt]: previousTicket,
    };
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
      order: [['autoIncrementId', 'DESC']],
      where,
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
