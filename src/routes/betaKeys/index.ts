// BetaKey
//  code
//  userId (the user who use this beta key to subscribe)

import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

import {
  postBetaKey,
} from './subRoutes';

const router = Router();

const betaKeyRoutes: () => Router = () => {
  router.delete('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.get('/', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.get('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.get('/me', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.get('/used', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.post('/', shouldBeAuth, shouldBeSuperAdmin, postBetaKey);

  return router;
};

export default betaKeyRoutes;

// TODO:
// BetaKey model
//  adminId
//  userId
//  usedAt
