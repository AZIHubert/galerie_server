import { Router } from 'express';
import socketIo from 'socket.io';
import {
  shouldBeAdmin,
  // shouldBeAuth,
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
  router.get('/', passport.authenticate('jwt'), shouldBeConfirmed, getUsers); // set token to request
  router.post('/signin/', shouldNotBeAuth, postUsersSignin);
  router.get('/confirmation/resend/', shouldNotBeAuth, getUsersConfirmationResend);
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation); // confirmation is not a middleware anymore
  router.get('/login/', shouldNotBeAuth, postUsersLogin);
  router.get('/resetPassword/', shouldNotBeAuth, getUsersResetPassword);
  router.get('/resetPassword/resend/', shouldNotBeAuth, getUsersResetPasswordResend);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.get('/me', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersMe); // set token to request
  router.get('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmail); // set token to request
  router.get('/me/updateEmail/resend/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailResend); // set token to request
  router.get('/me/updateEmail/confirm/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailConfirm); // set token to request
  router.get('/me/updateEmail/confirm/resend/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, getUsersMeUpdateEmailConfirmResend); // set token to request
  router.put('/me/updateEmail/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, putUsersMeUpdateEmail); // set token to request
  router.put('/me/updatePassword/', passport.authenticate('jwt', { session: false }), shouldNotBeGoogleOrFacebookUser, shouldBeConfirmed, putUsersMeUpdatePassword); // set token to request
  router.post('/me/profilePictures/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, uploadFile, postUsersMeProfilePictures(io)); // set token to request
  router.get('/me/profilePictures/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersMeProfilePictures); // set token to request
  router.get('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersMeProfilePicturesId); // set token to request
  router.put('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, putUsersMeProfilePicturesId); // set token to request
  router.delete('/me/profilePictures/:id/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, deleteUsersMeProfilePicturesId); // set token to request
  router.get('/logout/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersLogout); // set token to request
  router.get('/id/:id', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersIdId); // set token to request
  router.get('/userName/:userName/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, getUsersUserNameUserName); // set token to request
  router.put('/role/:id/:role', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, shouldBeSuperAdmin, putUsersRoleIdRole); // role should be in the body
  router.put('/blacklist/:id', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, shouldBeAdmin, putUsersBlacklistId); // set token to request
  router.get('/blacklist/', passport.authenticate('jwt', { session: false }), shouldBeConfirmed, shouldBeAdmin, getUsersBlackList); // set token to request
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
  return router;
};
export default usersRoutes;

// belongstomany
// https://medium.com/@tonyangelo9707/many-to-many-associations-using-sequelize-941f0b6ac102

// TODO:
// router.get('/me/blacklist/');
// model PersonalBlackList
// => userId
// belongstomany
// user
// router.put('/me/blacklist/:id/');
// router.get('/me/blacklist/:id/');
// router.delete('/me/blacklist/:id/');
// add field user pseudoname
// when login pseudoName = userName
// pseudoname can be changed

// https://www.youtube.com/watch?v=xMEOT9J0IvI&list=PLYQSCk-qyTW2ewJ05f_GKHtTIzjynDgjK&index=5&ab_channel=ZachGollwitzer
// https://www.youtube.com/watch?v=A23O4aUftXk&t=3233s&ab_channel=RyanMichaelHirst
// https://www.youtube.com/watch?v=SBvmnHTQIPY&ab_channel=TraversyMedia
// after google auth, create access token
// after auth, set to session refresh token,
// create a route refreshToken to verify refresh token and resend access token

// add middleWare verify authToken version
// replace all shouldBeAuth strategy
// set all authorization token
// passport.authenticate = jest.fn((authType, options, callback) => () => {
//  callback('This is an error', null);
// });

// demain matin, finsish changes
// demain aprem, continue Figma enough to become react
// demain soir, set up react/react native
