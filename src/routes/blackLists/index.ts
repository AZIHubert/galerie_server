import { Router } from 'express';

import {
  shouldBeAdmin,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteBlackListsId,

  getBlackLists,
  getBlackListsId,

  postBlackListsUserIs,

  putBlackListsId,
} from './subRoutes';

const router = Router();

const profilePicturesRoutes: () => Router = () => {
  router.delete('/:blackListId/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, deleteBlackListsId);

  router.get('/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, getBlackLists);
  router.get('/:blackListId/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, getBlackListsId);

  router.post('/:userId', passport.authenticate('jwt', { session: false }), shouldBeAdmin, postBlackListsUserIs);

  router.put('/:blackListId/', passport.authenticate('jwt', { session: false }), putBlackListsId);

  return router;
};
export default profilePicturesRoutes;

// TODO:
// update validators name validatePostUsersBlackLists... -> validatePostBlackLists...
// update check black list time
