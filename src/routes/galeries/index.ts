import { Router } from 'express';

import {
  shouldBeAuth,
  uploadFiles,
} from '@src/helpers/middlewares';

import {
  deleteGaleriesId,
  deleteGaleriesIdFramesId,
  deleteGaleriesIdInvitationsId,
  deleteGaleriesIdUnsubscribe,
  deleteGaleriesIdUsersId,

  getGaleries,
  getGaleriesFrames,
  getGaleriesId,
  getGaleriesIdFrames,
  getGaleriesIdFramesId,
  getGaleriesIdFramesIdLikes,
  getGaleriesIdInvitations,
  getGaleriesIdInvitationsId,
  getGaleriesIdUsers,

  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,

  putGaleriesId,
  putGaleriesIdFramesId,
  putGaleriesIdFramesIdGaleriePicturesId,
  putGaleriesIdUsersId,
} from './subRoutes';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:galerieId/', shouldBeAuth, deleteGaleriesId);
  router.delete('/:galerieId/frames/:frameId/', shouldBeAuth, deleteGaleriesIdFramesId);
  // TODO:
  router.delete('/:galerieId/invitations', shouldBeAuth, () => {});
  // delete all invitations
  // where: time !== null and time > new Date(Date.now())
  // or numOfInvits !== null and numOfInvits < 1
  router.delete('/:galerieId/invitations/:invitationId', shouldBeAuth, deleteGaleriesIdInvitationsId);
  router.delete('/:galerieId/unsubscribe/', shouldBeAuth, deleteGaleriesIdUnsubscribe);
  router.delete('/:galerieId/users/:userId', shouldBeAuth, deleteGaleriesIdUsersId);
  // TODO:
  router.delete('/:galerieId/users/:userId/blackLists/:blackListId');
  // delete a blackList

  router.get('/', shouldBeAuth, getGaleries);
  router.get('/frames', shouldBeAuth, getGaleriesFrames);
  router.get('/:galerieId/', shouldBeAuth, getGaleriesId);
  router.get('/:galerieId/frames/', shouldBeAuth, getGaleriesIdFrames);
  router.get('/:galerieId/frames/:frameId/', shouldBeAuth, getGaleriesIdFramesId);
  router.get('/:galerieId/frames/:frameId/likes', shouldBeAuth, getGaleriesIdFramesIdLikes);
  router.get('/:galerieId/invitations/', shouldBeAuth, getGaleriesIdInvitations);
  router.get('/:galerieId/invitations/:invitationId/', shouldBeAuth, getGaleriesIdInvitationsId);
  router.get('/:galerieId/users', shouldBeAuth, getGaleriesIdUsers);
  // TODO:
  router.get('/:galerieId/users/blackLists', shouldBeAuth, () => {});
  // return all users blackListed from this galerie

  router.post('/', shouldBeAuth, postGaleries);
  // TODO:
  router.post('/:galerieId/users/:userId/blackLists/', shouldBeAuth, () => {});
  // create a galerieBlackList
  router.post('/:galerieId/frames/', shouldBeAuth, uploadFiles, postGaleriesIdFrames);
  router.post('/:galerieId/frames/:frameId/likes/', shouldBeAuth, postGaleriesIdFramesIdLikes);
  router.post('/:galerieId/invitations/', shouldBeAuth, postGaleriesIdInvitations);
  router.post('/subscribe/', shouldBeAuth, postGaleriesSubscribe);

  router.put('/:galerieId/', shouldBeAuth, putGaleriesId);
  router.put('/:galerieId/frames/:frameId/', shouldBeAuth, putGaleriesIdFramesId);
  router.put('/:galerieId/frames/:frameId/galeriePictures/:galeriePictureId/', shouldBeAuth, putGaleriesIdFramesIdGaleriePicturesId);
  router.put('/:galerieId/users/:userId', shouldBeAuth, putGaleriesIdUsersId);
  return router;
};

export default galeriesRoutes;
