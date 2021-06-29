import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '#src/helpers/middlewares';

const router = Router();

const reportsRoutes: () => Router = () => {
  router.delete('/:reportId/', shouldBeAuth, shouldBeAdmin, () => {});

  router.get('/', shouldBeAuth, shouldBeAdmin, () => {});
  router.get('/:reportId/', shouldBeAuth, shouldBeAdmin, () => {});

  return router;
};
export default reportsRoutes;
