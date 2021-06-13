import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeAuth,
  shouldBeSuperAdmin,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
} from '@src/helpers/middlewares';

import {
  deleteUsersMe,

  getUsers,
  getUsersIdId,
  getUsersIdIdBlackLists,
  getUsersLogout,
  getUsersMe,
  getUsersRefreshToken,
  getUsersUserNameUserName,

  postUsersConfirmation,
  postUsersLogin,
  postUsersLoginSocialMedia,
  postUsersMeEmail,
  postUsersMeEmailConfirm,
  postUsersPassword,
  postUsersSignin,

  putUsersConfirmation,
  putUsersIdRole,
  putUsersMeEmail,
  putUsersMePseudonym,
  putUsersMePassword,
  putUsersPassword,
} from './subRoutes';

const router = Router();

const usersRoutes: () => Router = () => {
  router.delete('/me/', shouldBeAuth, deleteUsersMe);

  router.get('/', shouldBeAuth, getUsers);
  router.get('/id/:userId/', shouldBeAuth, getUsersIdId);
  router.get('/id/:userId/blackLists', shouldBeAuth, shouldBeAdmin, getUsersIdIdBlackLists);
  router.get('/logout/', shouldBeAuth, getUsersLogout);
  router.get('/me/', shouldBeAuth, getUsersMe);
  router.get('/refreshToken/', getUsersRefreshToken);
  router.get('/userName/:userName/', shouldBeAuth, getUsersUserNameUserName);

  router.post('/confirmation/', shouldNotBeAuth, postUsersConfirmation);
  router.post('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/login/socialMedia/', shouldNotBeAuth, postUsersLoginSocialMedia);
  router.post('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmail);
  router.post('/me/email/confirm/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmailConfirm);
  router.post('/password/', shouldNotBeAuth, postUsersPassword);
  router.post('/signin/', postUsersSignin);
  // TODO:
  // POST /signin/beta/
  // same as Signin but with a beta key code required

  router.put('/:userId/role/', shouldBeAuth, shouldBeSuperAdmin, putUsersIdRole);
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.put('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMeEmail);
  router.put('/me/password/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMePassword);
  router.put('/me/pseudonym/', shouldBeAuth, putUsersMePseudonym);
  router.put('/password/', shouldNotBeAuth, putUsersPassword);

  return router;
};
export default usersRoutes;
