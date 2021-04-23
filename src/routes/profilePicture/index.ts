import { Router } from 'express';

import { uploadFile } from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteProfilePicturesId,
  getProfilePictures,
  getProfilePicturesId,
  postProfilePictures,
  putProfilePicturesId,
} from './routes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.delete('/:id/', passport.authenticate('jwt', { session: false }), deleteProfilePicturesId);

  router.get('/', passport.authenticate('jwt', { session: false }), getProfilePictures);
  router.get('/:id/', passport.authenticate('jwt', { session: false }), getProfilePicturesId);

  router.post('/', passport.authenticate('jwt', { session: false }), uploadFile, postProfilePictures);

  router.put('/:id/', passport.authenticate('jwt', { session: false }), putProfilePicturesId);

  return router;
};
export default profilePicturesRoutes;
