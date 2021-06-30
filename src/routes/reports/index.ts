import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  getReports,
} from './subRoutes';

const router = Router();

const reportsRoutes: () => Router = () => {
  router.get('/', shouldBeAuth, shouldBeAdmin, getReports);
  router.get('/:reportId/', shouldBeAuth, shouldBeAdmin, () => {});

  router.put('/:reportId/', shouldBeAuth, shouldBeAdmin, () => {});

  return router;
};
export default reportsRoutes;
