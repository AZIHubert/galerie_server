import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

import {
  getBetaKeys,
  getBetaKeysId,

  postBetaKeys,

  putBetaKeysId,
} from './subRoutes';

const router = Router();

const betaKeyRoutes: () => Router = () => {
  router.delete('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.get('/', shouldBeAuth, shouldBeSuperAdmin, getBetaKeys);
  router.get('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, getBetaKeysId);

  // TODO:
  router.get('/email/:email', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.post('/', shouldBeAuth, shouldBeSuperAdmin, postBetaKeys);
  router.post('/:betaKeyId/send', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.put('/:betaKeyId', shouldBeAuth, shouldBeSuperAdmin, putBetaKeysId);

  return router;
};

export default betaKeyRoutes;

// betaKey.email should be unique
// betaKey.email should not be used by a user.
