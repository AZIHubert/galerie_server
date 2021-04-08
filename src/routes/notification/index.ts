import { Router } from 'express';

const router = Router();

const notificationRouter: () => Router = () => {
  router.get('/'); // get all notification
  router.delete('/:id'); // delete notification
  router.get('/:id');
  return router;
};

export default notificationRouter;
