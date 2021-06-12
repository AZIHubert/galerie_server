import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {
  deleteBlackListsId,

  getBlackLists,
  getBlackListsId,

  postBlackListsUserIs,
} from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.delete('/:blackListId/', shouldBeAuth, shouldBeAdmin, deleteBlackListsId);

  router.get('/', shouldBeAuth, shouldBeAdmin, getBlackLists);
  router.get('/:blackListId/', shouldBeAuth, shouldBeAdmin, getBlackListsId);

  router.post('/:userId', shouldBeAuth, shouldBeAdmin, postBlackListsUserIs);

  return router;
};
export default profilePicturesRoutes;
