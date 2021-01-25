import { Router } from 'express';
import socketIo from 'socket.io';

import {
  shouldBeAdmin,
  shouldBeConfirmed,
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
  router.get('/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsers);
  router.post('/signin/', postUsersSignin);
  router.get('/confirmation/resend/', shouldNotBeAuth, getUsersConfirmationResend);
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.get('/login/', shouldNotBeAuth, postUsersLogin);
  router.get('/resetPassword/', shouldNotBeAuth, getUsersResetPassword);
  router.get('/resetPassword/resend/', shouldNotBeAuth, getUsersResetPasswordResend);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.get('/me', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersMe);
  router.get('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmail);
  router.get('/me/updateEmail/resend/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailResend);
  router.get('/me/updateEmail/confirm/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailConfirm);
  router.get('/me/updateEmail/confirm/resend/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailConfirmResend);
  router.put('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, putUsersMeUpdateEmail);
  router.put('/me/updatePassword/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, putUsersMeUpdatePassword);
  router.post('/me/profilePictures/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, uploadFile, postUsersMeProfilePictures(io));
  router.get('/me/profilePictures/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersMeProfilePictures);
  router.get('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersMeProfilePicturesId);
  router.put('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, putUsersMeProfilePicturesId);
  router.delete('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, deleteUsersMeProfilePicturesId);
  router.get('/logout/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersLogout);
  router.get('/id/:id', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersIdId);
  router.get('/userName/:userName/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersUserNameUserName);
  router.put('/role/:id/:role', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, shouldBeSuperAdmin, putUsersRoleIdRole);
  router.put('/blacklist/:id', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, shouldBeAdmin, putUsersBlacklistId);
  router.get('/blacklist/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, shouldBeAdmin, getUsersBlackList);
  router.get('/oauth/google', passport.authenticate('google', {
    session: false,
    scope: [
      'profile',
      'email',
    ],
  }));
  router.get('/oauth/google/redirect', passport.authenticate('google', { session: false }), getUsersOauthGoogleRedirect);
  router.get('/oauth/facebook', passport.authenticate('facebook', {
    session: false,
    scope: [
      'email',
    ],
  }));
  router.get('/oauth/facebook/redirect', passport.authenticate('facebook', { session: false }), getUsersOauthFacebookRedirect);
  router.delete('/me', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, deleteUsersMe);
  router.get('/refreshToken', passport.authenticate('jwt', { session: false }), getUsersRefreshToken);
  return router;
};
export default usersRoutes;

// add middleWare verify authToken version
