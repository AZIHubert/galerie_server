import { Router } from 'express';

import {
  shouldBeAuth,
  uploadFile,
} from '@src/helpers/middlewares';

import {
  deleteProfilePicturesId,
  getProfilePictures,
  getProfilePicturesId,
  postProfilePictures,
  putProfilePicturesId,
} from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.delete('/:profilePictureId/', shouldBeAuth, deleteProfilePicturesId);

  router.get('/', shouldBeAuth, getProfilePictures);
  router.get('/:profilePictureId/', shouldBeAuth, getProfilePicturesId);

  router.post('/', shouldBeAuth, uploadFile, postProfilePictures);

  router.put('/:profilePictureId/', shouldBeAuth, putProfilePicturesId);

  return router;
};
export default profilePicturesRoutes;
