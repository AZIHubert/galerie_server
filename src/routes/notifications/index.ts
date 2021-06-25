import { Router } from 'express';

import {
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {
  postNotifications,
} from './subRoutes';

const router = Router();

const notificationRouter: () => Router = () => {
  router.delete('/:id', shouldBeAuth, () => {}); // delete notification

  router.get('/', shouldBeAuth, () => {}); // get all notification
  router.get('/:id', shouldBeAuth, () => {});

  router.post('/', postNotifications);

  return router;
};

export default notificationRouter;
