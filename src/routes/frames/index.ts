import { Router } from 'express';

import {
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  deleteFrameId,

  getFrames,
  getFramesId,
  getFramesIdLikes,

  postFramesIdLikes,
  postFramesIdReports,

  putFramesId,
  putFramesIdGaleriePicturesId,
} from './subRoutes';

const router = Router();

const framesRoutes: () => Router = () => {
  router.delete('/:frameId/', shouldBeAuth, deleteFrameId);

  router.get('/', shouldBeAuth, getFrames);
  router.get('/:frameId/', shouldBeAuth, getFramesId);
  router.get('/:frameId/likes/', shouldBeAuth, getFramesIdLikes);

  router.post('/:frameId/likes/', shouldBeAuth, postFramesIdLikes);
  router.post('/:frameId/reports/', shouldBeAuth, postFramesIdReports);

  router.put('/:frameId/', shouldBeAuth, putFramesId);
  router.put('/:frameId/galeriePictures/:galeriePictureId/', shouldBeAuth, putFramesIdGaleriePicturesId);

  return router;
};
export default framesRoutes;
