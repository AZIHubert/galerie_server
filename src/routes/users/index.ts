import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeSuperAdmin,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteUsersIdBlackList,
  deleteUsersMe,

  getUsers,
  getUsersBlackList,
  getUsersIdId,
  getUsersLogout,
  getUsersMe,
  getUsersRefreshToken,
  getUsersUserNameUserName,

  postUsersConfirmation,
  postUsersSignin,
  postUsersMeUpdateEmail,
  postUsersMeUpdateEmailConfirm,
  postUsersLogin,
  postUsersLoginSocialMedia,
  postUsersResetPassword,

  postUsersBlacklistId,
  putUsersConfirmation,
  putUsersMeEmail,
  putUsersMePseudonym,
  putUsersMePassword,
  putUsersResetPassword,
  putUsersRoleIdRole,
} from './subRoutes';

const router = Router();

const usersRoutes: () => Router = () => {
  // TODO:
  router.delete('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, deleteUsersIdBlackList);
  router.delete('/me/', passport.authenticate('jwt', { session: false }), deleteUsersMe);

  router.get('/', passport.authenticate('jwt', { session: false }), getUsers);
  router.get('/blacklist/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, getUsersBlackList);
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
  router.post('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, postUsersMeUpdateEmail);
  router.post('/me/updateEmail/confirm/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, postUsersMeUpdateEmailConfirm);
  router.post('/resetPassword/', shouldNotBeAuth, postUsersResetPassword);
  router.post('/signin/', postUsersSignin);

  // TODO:
  router.put('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, () => {});
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.put('/me/email/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMeEmail);
  router.put('/me/password/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMePassword);
  router.put('/me/pseudonym/', passport.authenticate('jwt', { session: false }), putUsersMePseudonym);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.put('/role/:id/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, putUsersRoleIdRole);

  return router;
};
export default usersRoutes;
