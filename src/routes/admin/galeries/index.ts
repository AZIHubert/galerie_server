import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

const router = Router();

const galerieRoutes: () => Router = () => {
  router.delete('/:galerieId', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.delete('/:galerieId/frames/:frameId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.get('/', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.get('/:galerieId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.get('/:galerieId/frames', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.get('/:galerieId/users', shouldBeAuth, shouldBeSuperAdmin, () => {});

  return router;
};

export default galerieRoutes;
