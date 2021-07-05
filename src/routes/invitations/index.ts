import { Router } from 'express';

import {
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  deleteInvitationId,

  getInvitationsId,
} from './subRoutes';

const router = Router();

const invitationsRoute: () => Router = () => {
  router.delete('/:invitationId', shouldBeAuth, deleteInvitationId);

  router.get('/:invitationId/', shouldBeAuth, getInvitationsId);

  return router;
};

export default invitationsRoute;
