import { Router } from 'express';
import socketIo from 'socket.io';
import {
  confirmation,
  login,
  shouldBeAdmin,
  shouldBeAuth,
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
  getUsersMe,
  getUsersMeProfilePictures,
  getUsersMeProfilePicturesId,
  getUsersMeUpdateEmail,
  getUsersMeUpdateEmailResend,
  getUsersMeUpdateEmailConfirm,
  getUsersMeUpdateEmailConfirmResend,
  getUsersResetPassword,
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
  router.get('/', shouldBeAuth, shouldBeConfirmed, getUsers);
  router.post('/signin/', shouldNotBeAuth, postUsersSignin);
  router.put('/confirmation/', shouldNotBeAuth, confirmation, passport.authenticate('local'), putUsersConfirmation);
  router.get('/confirmation/resend/', shouldNotBeAuth, getUsersConfirmationResend);
  router.get('/login/', shouldNotBeAuth, login, passport.authenticate('local'), postUsersLogin);
  router.get('/resetPassword/', shouldNotBeAuth, getUsersResetPassword);
  router.get('/resetPassword/resend/', shouldNotBeAuth, getUsersResetPasswordResend);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.get('/me', shouldBeAuth, shouldBeConfirmed, getUsersMe);
  router.get('/me/updateEmail/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmail);
  router.get('/me/updateEmail/resend/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailResend);
  router.get('/me/updateEmail/confirm/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailConfirm);
  router.get('/me/updateEmail/confirm/resend/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailConfirmResend);
  router.put('/me/updateEmail/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, putUsersMeUpdateEmail);
  router.put('/me/updatePassword/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, putUsersMeUpdatePassword);
  router.post('/me/profilePictures/', shouldBeAuth, shouldBeConfirmed, uploadFile, postUsersMeProfilePictures(io));
  router.get('/me/profilePictures/', shouldBeAuth, shouldBeConfirmed, getUsersMeProfilePictures);
  router.get('/me/profilePictures/:id/', shouldBeAuth, shouldBeConfirmed, getUsersMeProfilePicturesId);
  router.put('/me/profilePictures/:id/', shouldBeAuth, shouldBeConfirmed, putUsersMeProfilePicturesId);
  router.delete('/me/profilePictures/:id/', shouldBeAuth, shouldBeConfirmed, deleteUsersMeProfilePicturesId);
  router.get('/logout/', shouldBeAuth, shouldBeConfirmed, getUsersLogout);
  router.get('/id/:id', shouldBeAuth, shouldBeConfirmed, getUsersIdId);
  router.get('/userName/:userName/', shouldBeAuth, shouldBeConfirmed, getUsersUserNameUserName);
  router.put('/role/:id/:role', shouldBeAuth, shouldBeConfirmed, shouldBeSuperAdmin, putUsersRoleIdRole); // role should be in the body
  router.put('/blacklist/:id', shouldBeAuth, shouldBeConfirmed, shouldBeAdmin, putUsersBlacklistId);
  router.get('/blacklist/', shouldBeAuth, shouldBeConfirmed, shouldBeAdmin, getUsersBlackList);
  router.get('/oauth/google', passport.authenticate('google', {
    scope: [
      'profile',
      'email',
    ],
  }));
  router.get('/oauth/google/redirect', passport.authenticate('google'));
  router.delete('/me', shouldBeAuth, shouldBeConfirmed, deleteUsersMe);
  return router;
};
export default usersRoutes;

// belongstomany
// https://medium.com/@tonyangelo9707/many-to-many-associations-using-sequelize-941f0b6ac102

// TODO:
// router.get('/me/blacklist/');
// router.put('/me/blacklist/:id/');
// router.get('/me/blacklist/:id/');
// router.delete('/me/blacklist/:id/');
// add field user pseudoname
// when login pseudoName = userName
// pseudoname can be changed

// https://www.youtube.com/watch?v=xMEOT9J0IvI&list=PLYQSCk-qyTW2ewJ05f_GKHtTIzjynDgjK&index=5&ab_channel=ZachGollwitzer
// https://www.youtube.com/watch?v=A23O4aUftXk&t=3233s&ab_channel=RyanMichaelHirst
// https://www.youtube.com/watch?v=SBvmnHTQIPY&ab_channel=TraversyMedia
