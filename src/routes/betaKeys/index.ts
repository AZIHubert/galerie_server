// BetaKey
//  code
//  userId (the user who use this beta key to subscribe)

import { Router } from 'express';

import {
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

const router = Router();

const betaKeyRoutes: () => Router = () => {
  router.delete('/:betaKeyId', shouldBeSuperAdmin, () => {});

  router.get('/', shouldBeSuperAdmin, () => {});
  router.get('/:betaKeyId', shouldBeSuperAdmin, () => {});
  router.get('/me', shouldBeSuperAdmin, () => {});
  router.get('/used', shouldBeSuperAdmin, () => {});

  router.post('/', shouldBeSuperAdmin, () => {});

  return router;
};

export default betaKeyRoutes;

// TODO:
// BetaKey model
//  adminId
//  userId
//  usedAt
