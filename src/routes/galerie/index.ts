import { Router } from 'express';

import {
  uploadFiles,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteGaleriesIdFramesId,
  getGaleries,
  postGaleries,
  postGaleriesIdFrames,
  putGaleriesId,
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
  router.delete('/:id/frames/:frameId', passport.authenticate('jwt', { session: false }), deleteGaleriesIdFramesId);
  router.get('/', passport.authenticate('jwt', { session: false }), getGaleries); // DONE
  router.get('/:id', () => {
    // check if galerie exist
    // check if user have subscribe to this galerie
    // return this galerie
  }); // get one galerie
  router.get('/:id/frames/', () => {
    // check if galerie exist
    // check if user have subscribe to this galerie
    // return all frame (limit 20)
  });
  router.get('/:id/frames/:frameId', () => {
    // check if galerie exist
    // check if user have subscribe to this galerie
    // check if frame with frameId exist
    // and belong to this galerie
    // return this frame
  }); // get an image from a galerie
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
  router.get('/:id/users', () => {
    // check if galerie exist
    // check if user have subscribe to this galerie
    // return all users to this galerie (limit 20)
  }); // get all user from a galerie
  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries); // DONE
  router.post('/:id/frames', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames); // DONE
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
  router.put('/:id/unsubscribe/', () => {
    // check if galerie exist
    // check if user is subscribe to this galerie
    // remove galerieUser to this galerie
    // remove all frame upload by this user
  }); // unsubscribe to a galerie
  router.put('/:id/users/:userId', () => {
    // check if galerie exist
    // check if user is creator or admin
    // check if user userId exist
    // check if user userId is subscribe to this galerie
    // remove this user to the galerie
    // destroy all frames updloaded by this user
  }); // remove user from a galerie
  // put user role admin/user if current user is creator/admin
  return router;
};

export default galeriesRoutes;
