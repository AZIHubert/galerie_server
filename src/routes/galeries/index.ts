import { Router } from 'express';

import { uploadFiles } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteGaleriesId,
  deleteGaleriesIdFramesId,
  deleteGaleriesIdInvitationsId,
  deleteGaleriesIdUnsubscribe,
  deleteGaleriesIdUsersId,

  getGaleries,
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
  router.delete('/:galerieId/', passport.authenticate('jwt', { session: false }), deleteGaleriesId);
  router.delete('/:galerieId/frames/:frameId/', passport.authenticate('jwt', { session: false }), deleteGaleriesIdFramesId);
  router.delete('/:galerieId/invitations/:invitationId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdInvitationsId);
  router.delete('/:galerieId/unsubscribe/', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUnsubscribe);
  router.delete('/:galerieId/users/:userId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUsersId);

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
  router.get('/:galerieId/frames/:frameId/likes', passport.authenticate('jwt', { session: false }), getGaleriesIdFramesIdLikes);
  router.get('/:galerieId/invitations/', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitations);
  router.get('/:galerieId/invitations/:invitationId/', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitationsId);
  router.get('/:galerieId/users', passport.authenticate('jwt', { session: false }), getGaleriesIdUsers);

  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries);
  router.post('/:galerieId/frames/', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames);
  router.post('/:galerieId/frames/:frameId/likes/', passport.authenticate('jwt', { session: false }), postGaleriesIdFramesIdLikes);
  router.post('/:galerieId/invitations/', passport.authenticate('jwt', { session: false }), postGaleriesIdInvitations);
  router.post('/subscribe/', passport.authenticate('jwt', { session: false }), postGaleriesSubscribe);

  router.put('/:galerieId/', passport.authenticate('jwt', { session: false }), putGaleriesId);
  router.put('/:galerieId/frames/:frameId/', passport.authenticate('jwt', { session: false }), putGaleriesIdFramesId);
  router.put('/:galerieId/frames/:frameId/galeriePictures/:galeriePictureId/', passport.authenticate('jwt', { session: false }), putGaleriesIdFramesIdGaleriePicturesId);
  router.put('/:galerieId/users/:userId', passport.authenticate('jwt', { session: false }), putGaleriesIdUsersId);
  return router;
};

export default galeriesRoutes;

// TODO:
// add newFrames to galerieUser

// When GET /galeries/:galerieId
// newFrames become false

// When Post /galeries/:galerieId/frames
// newFrames become true for all other users.

// When returning galerie
// include newFrames.

// Update check invitation time (see blacklist)
