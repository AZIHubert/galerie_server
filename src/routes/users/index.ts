import { Router } from 'express';

import {
  shouldBeAuth,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
} from '@src/helpers/middlewares';

import {
  deleteUsersMe,

  getUsers,
  getUsersId,
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
  postUsersSigninBeta,

  putUsersConfirmation,
  putUsersMeEmail,
  putUsersMePseudonym,
  putUsersMePassword,
  putUsersPassword,
} from './subRoutes';

const router = Router();

const usersRoutes: () => Router = () => {
  router.delete('/me/', shouldBeAuth, deleteUsersMe);

  router.get('/', shouldBeAuth, getUsers);
  router.get('/logout/', shouldBeAuth, getUsersLogout);
  router.get('/me/', shouldBeAuth, getUsersMe);
  // TODO:
  router.get('/me/currentProfilePicture/', shouldBeAuth, () => {});
  router.get('/refreshToken/', getUsersRefreshToken);
  router.get('/userName/:userName/', shouldBeAuth, getUsersUserNameUserName);
  router.get('/:userId/', shouldBeAuth, getUsersId);
  // TODO:
  router.get('/:userId/currentProfilePicture', () => {});

  router.post('/confirmation/', shouldNotBeAuth, postUsersConfirmation);
  router.post('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/login/socialMedia/', shouldNotBeAuth, postUsersLoginSocialMedia);
  router.post('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmail);
  router.post('/me/email/confirm/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmailConfirm);
  router.post('/password/', shouldNotBeAuth, postUsersPassword);
  router.post('/signin/', shouldNotBeAuth, postUsersSignin);
  router.post('/signin/beta', shouldNotBeAuth, postUsersSigninBeta);

  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.put('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMeEmail);
  router.put('/me/password/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMePassword);
  router.put('/me/pseudonym/', shouldBeAuth, putUsersMePseudonym);
  router.put('/password/', shouldNotBeAuth, putUsersPassword);

  return router;
};
export default usersRoutes;
