import { Router } from 'express';

import {
  shouldBeAuth,
  uploadFiles,
} from '#src/helpers/middlewares';

import {
  deleteGaleriesId,
  deleteGaleriesIdBlackListsId,
  deleteGaleriesIdInvitations,
  deleteGaleriesIdInvitationsId,
  deleteGaleriesIdUnsubscribe,
  deleteGaleriesIdUsersId,

  getGaleries,
  getGaleriesId,
  getGaleriesIdBlackLists,
  getGaleriesIdBlackListsId,
  getGaleriesIdCoverPicture,
  getGaleriesIdFrames,
  getGaleriesIdInvitations,
  getGaleriesIdUsers,

  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesIdUsersIdBlackLists,
  postGaleriesSubscribe,

  putGaleriesId,
  putGaleriesIdAllowNotification,
  putGaleriesIdUsersId,
} from './subRoutes';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:galerieId/', shouldBeAuth, deleteGaleriesId);
  router.delete('/:galerieId/blackLists/:blackListId', shouldBeAuth, deleteGaleriesIdBlackListsId);
  router.delete('/:galerieId/invitations', shouldBeAuth, deleteGaleriesIdInvitations);
  // switch to /invitations/:invitationId/
  router.delete('/:galerieId/invitations/:invitationId', shouldBeAuth, deleteGaleriesIdInvitationsId);
  router.delete('/:galerieId/unsubscribe/', shouldBeAuth, deleteGaleriesIdUnsubscribe);
  router.delete('/:galerieId/users/:userId', shouldBeAuth, deleteGaleriesIdUsersId);

  router.get('/', shouldBeAuth, getGaleries);
  router.get('/:galerieId/', shouldBeAuth, getGaleriesId);
  router.get('/:galerieId/blackLists', shouldBeAuth, getGaleriesIdBlackLists);
  router.get('/:galerieId/blackLists/:blackListId', shouldBeAuth, getGaleriesIdBlackListsId);
  router.get('/:galerieId/coverPicture', shouldBeAuth, getGaleriesIdCoverPicture);
  router.get('/:galerieId/frames/', shouldBeAuth, getGaleriesIdFrames);
  router.get('/:galerieId/invitations/', shouldBeAuth, getGaleriesIdInvitations);
  router.get('/:galerieId/users', shouldBeAuth, getGaleriesIdUsers);

  router.post('/', shouldBeAuth, postGaleries);
  router.post('/subscribe/', shouldBeAuth, postGaleriesSubscribe);
  router.post('/:galerieId/users/:userId/blackLists/', shouldBeAuth, postGaleriesIdUsersIdBlackLists);
  router.post('/:galerieId/frames/', shouldBeAuth, uploadFiles, postGaleriesIdFrames);
  router.post('/:galerieId/invitations/', shouldBeAuth, postGaleriesIdInvitations);

  router.put('/:galerieId/', shouldBeAuth, putGaleriesId);
  router.put('/:galerieId/allowNotification', shouldBeAuth, putGaleriesIdAllowNotification);
  router.put('/:galerieId/users/:userId', shouldBeAuth, putGaleriesIdUsersId);
  return router;
};

export default galeriesRoutes;
