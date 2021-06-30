import { Router } from 'express';

import {
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  deleteFrameId,

  getFrames,
  getFramesId,
} from './subRoutes';

const router = Router();

const framesRoutes: () => Router = () => {
  router.delete('/:frameId', shouldBeAuth, deleteFrameId);

  router.get('/', shouldBeAuth, getFrames);
  router.get('/:frameId', shouldBeAuth, getFramesId);

  return router;
};
export default framesRoutes;
