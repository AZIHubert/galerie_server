import { Router } from 'express';

const router = Router();

const notificationRouter: () => Router = () => {
  router.get('/'); // get all notification
  router.delete('/:id'); // delete notification
  router.get('/:id');
  return router;
};

export default notificationRouter;

// TODO:
// Notification when
// someone likes your frame
// someone subscribe with your invitation
// your the creator of the galerie and someone subscribe to it
// someone delete one of your frame
// Notification when a admin delete your frame/ your profile pictures/ your galerie.
// Notification when a admin delete a galerie you was subscribe.
