import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
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
  router.get('/', shouldBeAuth, shouldBeSuperAdmin, getTickets);
  router.get('/:ticketId', shouldBeAuth, shouldBeSuperAdmin, getTicketsId);
  router.delete('/:ticketId', shouldBeAuth, shouldBeSuperAdmin, deleteTicketsId);

  return router;
};

export default ticketsRouter;
