import { Router } from 'express';

import { shouldBeSuperAdmin } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteTicketsId,
  getTickets,
  getTicketsId,
  postTickets,
} from './routes';

const router = Router();

const ticketsRouter: () => Router = () => {
  router.post('/', passport.authenticate('jwt', { session: false }), postTickets);
  router.get('/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, getTickets);
  router.get('/:id', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, getTicketsId);
  router.delete('/:id', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, deleteTicketsId);

  return router;
};

export default ticketsRouter;
