import { Router } from 'express';

import {
  uploadFiles,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  postGaleries,
  postGaleriesIdFrames,
} from './routes';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:id', () => {}); // delete a galerie
  router.delete('/:id/frames/:frameId'); // delete an image from a galerie
  router.delete('/:id/invits', () => {}); // delete a invit for a galerie
  router.get('/', () => {}); // get all galeries
  router.get('/:id', () => {}); // get one galerie
  router.get('/:id/frames/:frameId', () => {}); // get an image from a galerie
  router.get('/:id/invits', () => {}); // get all invit to a galerie
  router.get('/:id/invits/:invitId', () => {}); // get a invit to a galerie
  router.get('/:id/users', () => {}); // get all user from a galerie
  router.post('/', passport.authenticate('jwt', { session: false }), postGaleries);
  router.post('/:id/frames', passport.authenticate('jwt', { session: false }), uploadFiles, postGaleriesIdFrames);
  router.put('/:id', () => {}); // update a galerie
  router.put('/:id/frames/:id'); // like or unlike a galerie
  router.put('/:id/subscribe/', () => {}); // subscribe to a galerie
  router.put('/:id/unsubscribe/', () => {}); // unsubscribe to a galerie
  router.put('/:id/users/:userId', () => {}); // remove user from a galerie
  return router;
};

export default galeriesRoutes;
