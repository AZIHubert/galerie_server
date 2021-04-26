import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeSuperAdmin,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteUsersBlacklistId,
  deleteUsersMe,

  getUsers,
  getUsersBlacklist,
  getUsersIdId,
  getUsersLogout,
  getUsersMe,
  getUsersRefreshToken,
  getUsersUserNameUserName,

  postUsersBlacklistId,
  postUsersConfirmation,
  postUsersLogin,
  postUsersLoginSocialMedia,
  postUsersMeEmail,
  postUsersMeEmailConfirm,
  postUsersPassword,
  postUsersSignin,

  putUsersConfirmation,
  putUsersMeEmail,
  putUsersMePseudonym,
  putUsersMePassword,
  putUsersPassword,
  putUsersRoleId,
} from './subRoutes';

const router = Router();

const usersRoutes: () => Router = () => {
  router.delete('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, deleteUsersBlacklistId);
  router.delete('/me/', passport.authenticate('jwt', { session: false }), deleteUsersMe);

  router.get('/', passport.authenticate('jwt', { session: false }), getUsers);
  router.get('/blacklist/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, getUsersBlacklist);
  // TODO:
  router.get('/blacklist/:id', passport.authenticate('jwt', { session: false }), shouldBeAdmin, () => {});
  router.get('/id/:id/', passport.authenticate('jwt', { session: false }), getUsersIdId);
  router.get('/logout/', passport.authenticate('jwt', { session: false }), getUsersLogout);
  router.get('/me/', passport.authenticate('jwt', { session: false }), getUsersMe);
  router.get('/refreshToken/', getUsersRefreshToken);
  router.get('/userName/:userName/', passport.authenticate('jwt', { session: false }), getUsersUserNameUserName);

  router.post('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, postUsersBlacklistId);
  router.post('/confirmation/', shouldNotBeAuth, postUsersConfirmation);
  router.post('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/login/socialMedia/', shouldNotBeAuth, postUsersLoginSocialMedia);
  router.post('/me/email/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, postUsersMeEmail);
  router.post('/me/email/confirm/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, postUsersMeEmailConfirm);
  router.post('/password/', shouldNotBeAuth, postUsersPassword);
  router.post('/signin/', postUsersSignin);

  // TODO:
  router.put('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, () => {});
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.put('/me/email/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMeEmail);
  router.put('/me/password/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMePassword);
  router.put('/me/pseudonym/', passport.authenticate('jwt', { session: false }), putUsersMePseudonym);
  router.put('/password/', shouldNotBeAuth, putUsersPassword);
  router.put('/role/:id/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, putUsersRoleId);

  return router;
};
export default usersRoutes;
