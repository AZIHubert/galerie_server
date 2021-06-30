import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeModerator,
} from '#src/helpers/middlewares';

import {
  deleteTicketsId,
  getTickets,
  getTicketsId,
  postTickets,
} from './subRoutes';

const router = Router();

const ticketsRouter: () => Router = () => {
  router.post('/', shouldBeAuth, postTickets);
  router.get('/', shouldBeAuth, shouldBeModerator, getTickets);
  router.get('/:ticketId', shouldBeAuth, shouldBeModerator, getTicketsId);
  router.delete('/:ticketId', shouldBeAuth, shouldBeModerator, deleteTicketsId);

  return router;
};

export default ticketsRouter;
