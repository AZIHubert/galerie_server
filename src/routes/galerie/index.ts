import { Router } from 'express';

import {
  uploadFiles,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteGaleriesIdFramesId,
  deleteGaleriesIdUnsubscribe,
  deleteGaleriesIdUsersUserId,
  getGaleries,
  getGaleriesId,
  getGaleriesIdFrames,
  getGaleriesIdFramesId,
  getGaleriesIdInvitations,
  getGaleriesIdUsers,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  putGaleriesId,
  putGaleriesIdUsersUserId,
} from './routes';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:id', () => {
    // galerie should exist
    // user should be the creator
    // should delete all frames
    // should delete all galerie pictures
    // should delete all images
    // shouls delete all images from Google Storage
    // should delete all galerieUser models
  }); // delete a galerie
  router.delete('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdFramesId); // DONE
  router.delete('/:id/unsubscribe/', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUnsubscribe); // DONE
  router.delete('/:id/users/:userId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdUsersUserId); // DONE
  router.delete('/:id/invitations/:invitationId', passport.authenticate('jwt', { session: false }), () => {});
  router.get('/', passport.authenticate('jwt', { session: false }), getGaleries); // DONE
  router.get('/:id', passport.authenticate('jwt', { session: false }), getGaleriesId); // DONE
  router.get('/:id/frames/', passport.authenticate('jwt', { session: false }), getGaleriesIdFrames); // DONE
  router.get('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), getGaleriesIdFramesId); // DONE
  router.get('/:id/invitations', passport.authenticate('jwt', { session: false }), getGaleriesIdInvitations); // DONE
  router.get('/:id/invits/:invitId', () => {
    // check if galerie exist
    // check if user is the creator or an admin of this galerie
    // check if invit with invitId exist
    // and belong to this galerie
    // return this invit
  }); // get a invit to a galerie
  router.get('/:id/users', passport.authenticate('jwt', { session: false }), getGaleriesIdUsers); // DONE
  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries); // DONE
  router.post('/:id/frames', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames); // DONE
  router.post('/:id/invitations', passport.authenticate('jwt', { session: false }), postGaleriesIdInvitations); // DONE
  router.put('/:id', passport.authenticate('jwt', { session: false }), putGaleriesId); // DONE
  router.put('/:id/frames/:id', passport.authenticate('jwt', { session: false }), () => {});
  router.put('/subscribe/', () => {
    // Create a model Subscription
    // need token
    // check if token is valid
    // check if token.id is a valid galerie.id
    // check if user is not a subscriber of this galerie
    // add user to this galerie
    // delete the invitation (remove 1 to invitation.numberOfInvitation)
  }); // subscribe to a galerie
  router.put('/:id/users/:userId', passport.authenticate('jwt', { session: false }), putGaleriesIdUsersUserId); // DONE
  return router;
};

export default galeriesRoutes;
