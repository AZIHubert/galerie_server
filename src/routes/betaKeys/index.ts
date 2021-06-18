// BetaKey
//  code
//  userId (the user who use this beta key to subscribe)

import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

import {
  getBetaKeys,
  getBetaKeysId,

  postBetaKeys,
} from './subRoutes';

const router = Router();

const betaKeyRoutes: () => Router = () => {
  router.delete('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.get('/', shouldBeAuth, shouldBeSuperAdmin, getBetaKeys);
  router.get('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, getBetaKeysId);

  // Search for blackList send to
  router.get('/sendTo/:sendTo', shouldBeAuth, shouldBeSuperAdmin, () => {});

  // TODO:
  // send an email with the beta key
  // add field
  // send to.
  router.post('/', shouldBeAuth, shouldBeSuperAdmin, postBetaKeys);

  // TODO:
  router.put('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, () => {});
  // update only betaKey where sendTo === null
  // and send an email.

  return router;
};

export default betaKeyRoutes;

// TODO:
// return updatedAt
// actually,
// updatedAt === usedAt
