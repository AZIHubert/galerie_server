import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {

  getBlackLists,
  getBlackListsId,

  putBlackLists,
  putBlackListsId,
} from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.get('/', shouldBeAuth, shouldBeAdmin, getBlackLists);
  router.get('/:blackListId/', shouldBeAuth, shouldBeAdmin, getBlackListsId);

  // Keep this route.
  router.put('/', shouldBeAuth, shouldBeAdmin, putBlackLists);
  router.put('/:blackListId/', shouldBeAuth, shouldBeAdmin, putBlackListsId);

  return router;
};
export default profilePicturesRoutes;
