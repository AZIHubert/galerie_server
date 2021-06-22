import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

const router = Router();

const galerieRoutes: () => Router = () => {
  router.get('/:galerieId/users', shouldBeAuth, shouldBeSuperAdmin, () => {});

  return router;
};

export default galerieRoutes;
