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
  getGaleriesIdUsers,
  postGaleries,
  postGaleriesIdFrames,
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
  router.get('/', passport.authenticate('jwt', { session: false }), getGaleries); // should set users profile pictures
  router.get('/:id', passport.authenticate('jwt', { session: false }), getGaleriesId); // should set users profile pictures
  router.get('/:id/frames/', passport.authenticate('jwt', { session: false }), getGaleriesIdFrames); // should populate user
  router.get('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), getGaleriesIdFramesId); // should populate user
  router.get('/:id/invits', () => {
    // check if galerie exist
    // check if user is the creator or an admin of this galerie
    // return all invit to this galerie (limit 20)
  }); // get all invit to a galerie
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
  router.post('/:id/invits', () => {
    // check if galerie exist
    // check if user is admin or creator
    // invit =>
    // id
    // galerieId
    // userId
    // date (how long, if null, infinit)
    // numberOfInvit (how many, if null, infinit)
  });
  router.put('/:id', passport.authenticate('jwt', { session: false }), putGaleriesId); // DONE
  router.put('/:id/frames/:id', () => {
    // Need to create model Like
    // if user haven't like this frame add a frame
    // if user has already like this frame, delete this frame
  }); // like or unlike a galerie
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
