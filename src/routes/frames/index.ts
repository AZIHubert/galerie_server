import { Router } from 'express';

import {
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  deleteFrameId,

  getFrames,
  getFramesId,

  postFramesIdLikes,
} from './subRoutes';

const router = Router();

const framesRoutes: () => Router = () => {
  router.delete('/:frameId', shouldBeAuth, deleteFrameId);

  router.get('/', shouldBeAuth, getFrames);
  router.get('/:frameId', shouldBeAuth, getFramesId);

  router.post('/:frameId/likes', shouldBeAuth, postFramesIdLikes);

  return router;
};
export default framesRoutes;
