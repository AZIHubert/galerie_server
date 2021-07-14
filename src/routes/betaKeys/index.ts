import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeAdmin,
} from '#src/helpers/middlewares';

import {
  deleteBetaKeysId,

  getBetaKeys,
  getBetaKeysId,

  postBetaKeys,
  postBetaKeysIdSend,

  putBetaKeysId,
} from './subRoutes';

const router = Router();

const betaKeyRoutes: () => Router = () => {
  router.delete('/:betaKeyId', shouldBeAuth, shouldBeAdmin, deleteBetaKeysId);

  router.get('/', shouldBeAuth, shouldBeAdmin, getBetaKeys);
  router.get('/:betaKeyId', shouldBeAuth, shouldBeAdmin, getBetaKeysId);

  router.post('/', shouldBeAuth, shouldBeAdmin, postBetaKeys);
  router.post('/:betaKeyId/send', shouldBeAuth, shouldBeAdmin, postBetaKeysIdSend);

  router.put('/:betaKeyId', shouldBeAuth, shouldBeAdmin, putBetaKeysId);

  return router;
};

export default betaKeyRoutes;

// betaKey.email should be unique
// betaKey.email should not be used by a user.
