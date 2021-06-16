import {
  Ticket,
} from '@src/db/models';

export default async ({
  body = 'ticket\'s body',
  header = 'ticket\'s header',
  userId,
}: {
  body?: string;
  header?: string;
  userId?: string;
}) => {
  const ticket = await Ticket.create({
    body,
    header,
    userId,
  });
  return ticket;
};
