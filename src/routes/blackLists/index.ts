import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {

  getBlackLists,
  getBlackListsId,

  putBlackLists,
} from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  // DONE
  router.get('/', shouldBeAuth, shouldBeAdmin, getBlackLists);
  // DONE
  router.get('/:blackListId/', shouldBeAuth, shouldBeAdmin, getBlackListsId);

  // Keep this route.
  router.put('/', shouldBeAuth, shouldBeAdmin, putBlackLists);

  return router;
};
export default profilePicturesRoutes;
