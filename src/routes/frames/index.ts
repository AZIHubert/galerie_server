import { Router } from 'express';

import {
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  deleteFrameId,

  getFrames,
} from './subRoutes';

const router = Router();

const framesRoutes: () => Router = () => {
  router.delete('/:frameId', shouldBeAuth, deleteFrameId);

  router.get('/', shouldBeAuth, getFrames);

  return router;
};
export default framesRoutes;
