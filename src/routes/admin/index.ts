import {
  Router,
} from 'express';

import users from './users';

const router = Router();

const adminRoutes: () => Router = () => {
  router.use('/users', users());

  return router;
};

export default adminRoutes;
