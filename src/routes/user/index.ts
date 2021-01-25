import { Router } from 'express';
import socketIo from 'socket.io';

import {
  facebookAuthentication,
  googleAuthentication,
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
  getUsersConfirmationResend,
  getUsersIdId,
  getUsersLogout,
  getUsersOauthFacebookRedirect,
  getUsersOauthGoogleRedirect,
  getUsersMe,
  getUsersMeProfilePictures,
  getUsersMeProfilePicturesId,
  getUsersMeUpdateEmail,
  getUsersMeUpdateEmailResend,
  getUsersMeUpdateEmailConfirm,
  getUsersMeUpdateEmailConfirmResend,
  getUsersResetPassword,
  getUsersRefreshToken,
  getUsersResetPasswordResend,
  getUsersUserNameUserName,
  postUsersSignin,
  putUsersBlacklistId,
  putUsersConfirmation,
  postUsersLogin,
  putUsersMeProfilePicturesId,
  postUsersMeProfilePictures,
  putUsersMeUpdateEmail,
  putUsersMeUpdatePassword,
  putUsersResetPassword,
  putUsersRoleIdRole,
} from './routes';

const router = Router();

const usersRoutes: (io: socketIo.Server) => Router = (io: socketIo.Server) => {
  router.get('/', passport.authenticate('jwt', { session: false }), getUsers);
  router.post('/signin/', postUsersSignin);
  router.get('/confirmation/resend/', shouldNotBeAuth, getUsersConfirmationResend);
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.get('/login/', shouldNotBeAuth, postUsersLogin);
  router.get('/resetPassword/', shouldNotBeAuth, getUsersResetPassword);
  router.get('/resetPassword/resend/', shouldNotBeAuth, getUsersResetPasswordResend);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.get('/me', passport.authenticate('jwt', { session: false }), getUsersMe);
  router.get('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, getUsersMeUpdateEmail);
  router.get('/me/updateEmail/resend/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, getUsersMeUpdateEmailResend);
  router.get('/me/updateEmail/confirm/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, getUsersMeUpdateEmailConfirm);
  router.get('/me/updateEmail/confirm/resend/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, getUsersMeUpdateEmailConfirmResend);
  router.put('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMeUpdateEmail);
  router.put('/me/updatePassword/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, putUsersMeUpdatePassword);
  router.post('/me/profilePictures/', passport.authenticate('jwt', { session: false }), uploadFile, postUsersMeProfilePictures(io));
  router.get('/me/profilePictures/', passport.authenticate('jwt', { session: false }), getUsersMeProfilePictures);
  router.get('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), getUsersMeProfilePicturesId);
  router.put('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), putUsersMeProfilePicturesId);
  router.delete('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), deleteUsersMeProfilePicturesId);
  router.get('/logout/', passport.authenticate('jwt', { session: false }), getUsersLogout);
  router.get('/id/:id', passport.authenticate('jwt', { session: false }), getUsersIdId);
  router.get('/userName/:userName/', passport.authenticate('jwt', { session: false }), getUsersUserNameUserName);
  router.put('/role/:id/', passport.authenticate('jwt', { session: false }), shouldBeSuperAdmin, putUsersRoleIdRole);
  router.put('/blacklist/:id/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, putUsersBlacklistId);
  router.get('/blacklist/', passport.authenticate('jwt', { session: false }), shouldBeAdmin, getUsersBlackList);
  router.get('/oauth/google', passport.authenticate('google', {
    session: false,
    scope: [
      'profile',
      'email',
    ],
  }));
  router.get('/oauth/google/redirect', googleAuthentication, getUsersOauthGoogleRedirect);
  router.get('/oauth/facebook', passport.authenticate('facebook', {
    session: false,
    scope: [
      'email',
    ],
  }));
  router.get('/oauth/facebook/redirect', facebookAuthentication, getUsersOauthFacebookRedirect);
  router.delete('/me', passport.authenticate('jwt', { session: false }), deleteUsersMe);
  router.get('/refreshToken', passport.authenticate('jwt', { session: false }), getUsersRefreshToken);
  return router;
};
export default usersRoutes;
