// put user role

import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

const router = Router();

const usersRoutes: () => Router = () => {
  router.put('/:userId/role', shouldBeAuth, shouldBeSuperAdmin, () => {});

  return router;
};

export default usersRoutes;
