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

  // use invitationToken
  // when get /invitation/:invitationId
  // return a unique jwt used to generate the QRcode.
  // for now, not sure if qrcode is supposed to be generated
  // by the server or the client
  // but in case it's suppose to be the server
  // this route gonna be used to generate the QRcode.
  // public
  router.get('/qrCode/', shouldBeAuth, () => {});

  return router;
};

export default invitationsRoute;
