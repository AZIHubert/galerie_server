import { Router } from 'express';

import {
  shouldBeModerator,
  shouldBeAuth,
} from '#src/helpers/middlewares';

import {
  getReports,
  getReportsId,

  putReportsId,
} from './subRoutes';

const router = Router();

const reportsRoutes: () => Router = () => {
  router.get('/', shouldBeAuth, shouldBeModerator, getReports);
  router.get('/:reportId/', shouldBeAuth, shouldBeModerator, getReportsId);

  router.put('/:reportId/', shouldBeAuth, shouldBeModerator, putReportsId);

  return router;
};
export default reportsRoutes;
