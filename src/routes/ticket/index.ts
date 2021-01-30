import { Router } from 'express';
import socketIo from 'socket.io';

import { shouldBeSuperAdmin } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteTicketsId,
  getTickets,
  postTickets,
} from './routes';

const router = Router();

const ticketsRouter: (io: socketIo.Server) => Router = (io: socketIo.Server) => {
  router.post('/', passport.authenticate('jwt', { session: false }), postTickets(io));
  router.get('/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, getTickets);
  router.get('/:id', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin);
  router.delete('/:id', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, deleteTicketsId);

  return router;
};

export default ticketsRouter;
