import {
  Request,
  Response,
} from 'express';

import {
  User,
  Ticket,
} from '#src/db/models';

import {
  normalizeJoiErrors,
  validatePostTicketBody,
} from '#src/helpers/schemas';

export default async (req: Request, res: Response) => {
  const currentUser = req.user as User;

  // Validate request.body.
  const {
    error,
    value,
  } = validatePostTicketBody(req.body);
  if (error) {
    return res.status(400).send({
      errors: normalizeJoiErrors(error),
    });
  }

  // Create ticket.
  try {
    await Ticket.create({
      ...value,
      userId: currentUser.id,
    });
  } catch (err) {
    return res.status(500).send(err);
  }

  return res.status(200).send({
    action: 'POST',
  });
};
