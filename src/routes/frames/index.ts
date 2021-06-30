import { Router } from 'express';

import {
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  deleteFrameId,
} from './subRoutes';

const router = Router();

const framesRoutes: () => Router = () => {
  router.delete('/:frameId', shouldBeAuth, deleteFrameId);

  return router;
};
export default framesRoutes;
