import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  getReports,
  getReportsId,

  putReportsId,
} from './subRoutes';

const router = Router();

const reportsRoutes: () => Router = () => {
  router.get('/', shouldBeAuth, shouldBeAdmin, getReports);
  router.get('/:reportId/', shouldBeAuth, shouldBeAdmin, getReportsId);

  router.put('/:reportId/', shouldBeAuth, shouldBeAdmin, putReportsId);

  return router;
};
export default reportsRoutes;
