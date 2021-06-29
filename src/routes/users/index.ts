import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
  shouldBeSuperAdmin,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
} from '#src/helpers/middlewares';

import {
  deleteUsersIdProfilePicturesId,
  deleteUsersMe,

  getUsers,
  getUsersId,
  getUsersIdBlackLists,
  getUsersIdBlackListsId,
  getUsersIdCurrentProfilePicture,
  getUsersIdProfilePictures,
  getUsersIdProfilePicturesId,
  getUsersLogout,
  getUsersMe,
  getUsersMeCurrentProfilePicture,
  getUsersRefreshToken,

  postUsersConfirmation,
  postUsersIdBlackLists,
  postUsersLogin,
  postUsersLoginSocialMedia,
  postUsersMeEmail,
  postUsersMeEmailConfirm,
  postUsersPassword,
  postUsersSignin,
  postUsersSigninBeta,

  putUsersConfirmation,
  putUsersIdBlackLists,
  putUsersIdRole,
  putUsersMeEmail,
  putUsersMeHasNewNotifications,
  putUsersMePseudonym,
  putUsersMePassword,
  putUsersPassword,
} from './subRoutes';

const router = Router();

const usersRoutes: () => Router = () => {
  router.delete('/me/', shouldBeAuth, deleteUsersMe);
  router.delete('/:userId/profilePictures/:profilePictureId', shouldBeAuth, shouldBeAdmin, deleteUsersIdProfilePicturesId);

  router.get('/', shouldBeAuth, getUsers);
  router.get('/logout/', shouldBeAuth, getUsersLogout);
  router.get('/me/', shouldBeAuth, getUsersMe);
  router.get('/me/currentProfilePicture/', shouldBeAuth, getUsersMeCurrentProfilePicture);
  router.get('/refreshToken/', getUsersRefreshToken);
  router.get('/:userId/', shouldBeAuth, getUsersId);
  router.get('/:userId/blackLists', shouldBeAuth, shouldBeAdmin, getUsersIdBlackLists);
  router.get('/:userId/blackLists/:blackListId', shouldBeAuth, shouldBeAdmin, getUsersIdBlackListsId);
  router.get('/:userId/currentProfilePicture', shouldBeAuth, getUsersIdCurrentProfilePicture);
  router.get('/:userId/profilePictures', shouldBeAuth, shouldBeAdmin, getUsersIdProfilePictures);
  router.get('/:userId/profilePictures/:profilePictureId', shouldBeAuth, shouldBeAdmin, getUsersIdProfilePicturesId);

  router.post('/confirmation/', shouldNotBeAuth, postUsersConfirmation);
  router.post('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/login/socialMedia/', shouldNotBeAuth, postUsersLoginSocialMedia);
  router.post('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmail);
  router.post('/me/email/confirm/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmailConfirm);
  router.post('/password/', shouldNotBeAuth, postUsersPassword);
  router.post('/signin/', shouldNotBeAuth, postUsersSignin);
  router.post('/signin/beta', shouldNotBeAuth, postUsersSigninBeta);
  router.post('/:userId/currentProfilePicture/reposts', shouldBeAuth, () => {});
  router.post('/:userId/blackLists', shouldBeAuth, shouldBeAdmin, postUsersIdBlackLists);

  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.put('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMeEmail);
  router.put('/me/hasNewNotifications', shouldBeAuth, putUsersMeHasNewNotifications);
  router.put('/me/password/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMePassword);
  router.put('/me/pseudonym/', shouldBeAuth, putUsersMePseudonym);
  router.put('/password/', shouldNotBeAuth, putUsersPassword);
  router.put('/:userId/blackLists/', shouldBeAuth, shouldBeAdmin, putUsersIdBlackLists);
  router.put('/:userId/role', shouldBeAuth, shouldBeSuperAdmin, putUsersIdRole);

  return router;
};
export default usersRoutes;
