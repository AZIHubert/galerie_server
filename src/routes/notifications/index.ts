import { Router } from 'express';

import {
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {
  postNotification,
} from './subRoutes';

const router = Router();

const notificationRouter: () => Router = () => {
  router.delete('/:id', shouldBeAuth, () => {}); // delete notification

  router.get('/', shouldBeAuth, () => {}); // get all notification
  router.get('/:id', shouldBeAuth, () => {});

  router.post('/', postNotification);

  return router;
};

export default notificationRouter;
