import { Router } from 'express';

import {
  shouldBeModerator,
  shouldBeAuth,
} from '#src/helpers/middlewares';

import putBlackLists from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.put('/', shouldBeAuth, shouldBeModerator, putBlackLists);

  return router;
};
export default profilePicturesRoutes;
