import { Router } from 'express';

import {
  shouldBeAuth,
} from '@src/helpers/middlewares';

import {
  deleteNotificationsId,

  getNotifications,
  getNotificationsId,

  postNotifications,

  putNotificationsId,
} from './subRoutes';

const router = Router();

const notificationRouter: () => Router = () => {
  router.delete('/:notificationId', shouldBeAuth, deleteNotificationsId);

  router.get('/', shouldBeAuth, getNotifications);
  router.get('/:notificationId', shouldBeAuth, getNotificationsId);

  router.post('/', postNotifications);

  router.put('/:notificationId', shouldBeAuth, putNotificationsId);

  return router;
};

export default notificationRouter;
