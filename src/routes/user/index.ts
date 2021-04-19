import { Router } from 'express';

import {
  shouldBeAdmin,
  shouldBeSuperAdmin,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
  uploadFile,
} from '@src/helpers/middlewares';
import passport from '@src/helpers/passport';

import {
  deleteUsersMe,
  deleteUsersMeProfilePicturesId,
  getUsers,
  getUsersBlackList,
  postUsersConfirmation,
  getUsersIdId,
  getUsersLogout,
  getUsersMe,
  getUsersMeProfilePictures,
  getUsersMeProfilePicturesId,
  getUsersRefreshToken,
  getUsersUserNameUserName,
  postUsersSignin,
  putUsersBlacklistId,
  putUsersConfirmation,
  postUsersLogin,
  postUsersLoginSocialMedia,
  putUsersMePseudonym,
  putUsersMeProfilePicturesId,
  postUsersMeProfilePictures,
  postUsersMeUpdateEmail,
  postUsersMeUpdateEmailConfirm,
  postUsersResetPassword,
  putUsersMeUpdateEmail,
  putUsersMeUpdatePassword,
  putUsersResetPassword,
  putUsersRoleIdRole,
} from './routes';

const router = Router();

const usersRoutes: () => Router = () => {
  router.get('/', passport.authenticate('jwt', { session: false }), getUsers);
  router.post('/signin/', postUsersSignin);
  router.post('/confirmation/', shouldNotBeAuth, postUsersConfirmation);
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.post('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/login/socialMedia', shouldNotBeAuth, postUsersLoginSocialMedia);
  router.post('/resetPassword/', shouldNotBeAuth, postUsersResetPassword);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.get('/me', passport.authenticate('jwt', { session: false }), getUsersMe);
  router.post('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, postUsersMeUpdateEmail);
  router.post('/me/updateEmail/confirm/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, postUsersMeUpdateEmailConfirm);
  router.put('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMeUpdateEmail);
  router.put('/me/updatePassword/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMeUpdatePassword);
  router.post('/me/profilePictures/', passport.authenticate('jwt', { session: false }), uploadFile, postUsersMeProfilePictures);
  router.get('/me/profilePictures/', passport.authenticate('jwt', { session: false }), getUsersMeProfilePictures);
  router.get('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), getUsersMeProfilePicturesId);
  router.put('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), putUsersMeProfilePicturesId);
  router.put('/me/pseudonym', passport.authenticate('jwt', { session: false }), putUsersMePseudonym);
  router.delete('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), deleteUsersMeProfilePicturesId);
  router.get('/logout/', passport.authenticate('jwt', { session: false }), getUsersLogout);
  router.get('/id/:id', passport.authenticate('jwt', { session: false }), getUsersIdId);
  router.get('/userName/:userName/', passport.authenticate('jwt', { session: false }), getUsersUserNameUserName);
  router.put('/role/:id/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, putUsersRoleIdRole);
  router.put('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, putUsersBlacklistId);
  router.get('/blacklist/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, getUsersBlackList);
  router.delete('/me', passport.authenticate('jwt', { session: false }), deleteUsersMe);
  router.get('/refreshToken', getUsersRefreshToken);
  return router;
};
export default usersRoutes;
