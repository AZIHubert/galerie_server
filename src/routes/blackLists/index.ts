import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '#src/helpers/middlewares';

import putBlackLists from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.put('/', shouldBeAuth, shouldBeAdmin, putBlackLists);

  return router;
};
export default profilePicturesRoutes;
