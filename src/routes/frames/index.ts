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
} from './subRoutes';

const router = Router();

const framesRoutes: () => Router = () => {
  router.delete('/:frameId/', shouldBeAuth, deleteFrameId);

  router.get('/', shouldBeAuth, getFrames);
  router.get('/:frameId/', shouldBeAuth, getFramesId);
  router.get('/:frameId/likes/', shouldBeAuth, getFramesIdLikes);

  router.post('/:frameId/likes/', shouldBeAuth, postFramesIdLikes);

  return router;
};
export default framesRoutes;
