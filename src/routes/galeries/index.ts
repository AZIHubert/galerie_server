import { Router } from 'express';

import { uploadFiles } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteGalerieId,
  deleteGaleriesIdFramesId,
  deleteGaleriesIdInvitationsId,
  deleteGaleriesIdUnsubscribe,
  deleteGaleriesIdUsersUserId,

  getGaleries,
  getGaleriesId,
  getGaleriesIdFrames,
  getGaleriesIdFramesId,
  getGalerieIdFrameIdLikes,
  getGaleriesIdInvitations,
  getGaleriesIdInvitationsId,
  getGaleriesIdUsers,

  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,

  putGaleriesId,
  putGaleriesIdFramesIdGaleriePicturesId,
  putGaleriesIdUsersUserId,
} from './subRoutes';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:galerieId/', passport.authenticate('jwt', { session: false }), deleteGalerieId);
  router.delete('/:galerieId/frames/:frameId/', passport.authenticate('jwt', { session: false }), deleteGaleriesIdFramesId);
  router.delete('/:galerieId/invitations/:invitationId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdInvitationsId);
  router.delete('/:galerieId/unsubscribe/', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUnsubscribe);
  router.delete('/:galerieId/users/:userId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUsersUserId);

  router.get('/', passport.authenticate('jwt', { session: false }), getGaleries);
  router.get('/frames', passport.authenticate('jwt', { session: false }), () => {
    // await Frame.findAll({
    //  where: {
    //    galerieId: {
    //      in: ArrayOfIdWhereUserIsSubscribeToIt
    //    }
    //  }
    // })
  });
  router.get('/:galerieId/', passport.authenticate('jwt', { session: false }), getGaleriesId);
  router.get('/:galerieId/frames/', passport.authenticate('jwt', { session: false }), getGaleriesIdFrames);
  router.get('/:galerieId/frames/:frameId/', passport.authenticate('jwt', { session: false }), getGaleriesIdFramesId);
  router.get('/:galerieId/frames/:frameId/likes', passport.authenticate('jwt', { session: false }), getGalerieIdFrameIdLikes);
  router.get('/:galerieId/invitations/', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitations);
  router.get('/:galerieId/invitations/:invitationId/', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitationsId);
  router.get('/:galerieId/users', passport.authenticate('jwt', { session: false }), getGaleriesIdUsers);

  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries);
  router.post('/:galerieId/frames/', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames);
  router.post('/:galerieId/frames/:frameId/likes/', passport.authenticate('jwt', { session: false }), postGaleriesIdFramesIdLikes);
  router.post('/:galerieId/invitations/', passport.authenticate('jwt', { session: false }), postGaleriesIdInvitations);
  router.post('/subscribe/', passport.authenticate('jwt', { session: false }), postGaleriesSubscribe);

  router.put('/:galerieId/', passport.authenticate('jwt', { session: false }), putGaleriesId);
  router.put('/:galerieId/frames/:frameId/galeriePictures/:galeriePictureId/', passport.authenticate('jwt', { session: false }), putGaleriesIdFramesIdGaleriePicturesId);
  router.put('/:galerieId/users/:userId', passport.authenticate('jwt', { session: false }), putGaleriesIdUsersUserId);
  return router;
};

export default galeriesRoutes;

// TODO:
// add description to frame.
// add newFrames to galerieUser

// When GET /galeries/:galerieId
// newFrames become false

// When Post /galeries/:galerieId/frames
// newFrames become true for all other users.

// When returning galerie
// include newFrames.
