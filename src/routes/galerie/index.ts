import { Router } from 'express';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:id', () => {}); // delete a galerie
  router.delete('/:id/images/:imageId'); // delete an image from a galerie
  router.delete('/:id/invits', () => {}); // delete a invit for a galerie
  router.get('/', () => {}); // get all galeries
  router.get('/:id', () => {}); // get one galerie
  router.get('/:id/images/:imageId', () => {}); // get an image from a galerie
  router.get('/:id/invits', () => {}); // get all invit to a galerie
  router.get('/:id/invits/:invitId', () => {}); // get a invit to a galerie
  router.get('/:id/users', () => {}); // get all user from a galerie
  router.post('/', () => {}); // create a galerie
  router.post('/:id/images', () => {}); // post a picture on a galerie
  router.post('/:id/invits', () => {}); // create a invite for a galerie
  router.put('/:id', () => {}); // update a galerie
  router.put('/:id/images/:id'); // like or unlike a galerie
  router.put('/:id/subscribe/', () => {}); // subscribe to a galerie
  router.put('/:id/unsubscribe/', () => {}); // unsubscribe to a galerie
  router.put('/:id/users/:userId', () => {}); // remove user from a galerie
  return router;
};

export default galeriesRoutes;
