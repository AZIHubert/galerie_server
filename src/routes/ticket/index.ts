import { Router } from 'express';
import socketIo from 'socket.io';

import { shouldBeSuperAdmin } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

const router = Router();

const ticketsRouter: (io: socketIo.Server) => Router = (io: socketIo.Server) => {
  router.put('/', passport.authenticate('jwt', { session: false }));
  router.get('/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin);
  router.get('/:id', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin);
  router.delete('/:id', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin);

  return router;
};

export default ticketsRouter;
