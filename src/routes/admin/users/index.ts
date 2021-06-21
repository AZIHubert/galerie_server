// blackList a user
// return users\'s blackLists
// return user\'s profilePictures
// delete user\'s profilePicture
// put user role

import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeSuperAdmin,
} from '@src/helpers/middlewares';

const router = Router();

const usersRoutes: () => Router = () => {
  router.delete('/:userId/profilePictures/:profilePictureId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.get('/:userId/profilePictures', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.get('/:userId/profilePictures/:profilePictureId', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.post('/:userId/blackLists', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.post('/:userId/profilePictures', shouldBeAuth, shouldBeSuperAdmin, () => {});

  router.put('/:userId/blackLists', shouldBeAuth, shouldBeSuperAdmin, () => {});
  router.put('/:userId/role', shouldBeAuth, shouldBeSuperAdmin, () => {});

  return router;
};

export default usersRoutes;
