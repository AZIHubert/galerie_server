import { Router } from 'express';

import {
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {
  getNotifications,

  postNotifications,
} from './subRoutes';

const router = Router();

const notificationRouter: () => Router = () => {
  router.delete('/:notificationId', shouldBeAuth, () => {});

  router.get('/', shouldBeAuth, getNotifications);
  router.get('/:notificationId', shouldBeAuth, () => {});

  router.post('/', postNotifications);

  // set notification.seen to true.
  router.put('/:notificationId', shouldBeAuth, () => {});

  return router;
};

export default notificationRouter;
