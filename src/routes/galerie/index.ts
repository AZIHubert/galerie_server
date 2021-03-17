import { Router } from 'express';

const router = Router();

const galeriesRoutes: () => Router = () => {
  router.delete('/:id', () => {});
  router.get('/', () => {});
  router.get('/:id', () => {});
  router.post('/', () => {});
  router.put('/', () => {});
  router.put('/subscribe/:id', () => {});
  return router;
};

export default galeriesRoutes;
