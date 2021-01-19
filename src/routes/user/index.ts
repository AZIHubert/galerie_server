import { Router } from 'express';
import socketIo from 'socket.io';

import {
  shouldBeAuth,
  shouldBeConfirmed,
  shouldNotBeAuth,
  uploadFile,
} from '@src/helpers/middlewares';

import {
  deleteUsersMeProfilePicturesId,
  getUsers,
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
  postUsersLogin,
  postUsersRefreshToken,
  postUsersSignin,
  putUsersConfirmation,
  putUsersMeProfilePicturesId,
  postUsersMeProfilePictures,
  putUsersMeUpdateEmail,
  putUsersMeUpdatePassword,
  putUsersResetPassword,
} from './routes';

const router = Router();

const usersRoutes: (io: socketIo.Server) => Router = (io: socketIo.Server) => {
  router.get('/', shouldBeAuth, shouldBeConfirmed, getUsers);
  router.post('/signin/', shouldNotBeAuth, postUsersSignin);
  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.get('/confirmation/resend/', shouldNotBeAuth, getUsersConfirmationResend);
  router.get('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/refreshToken/', postUsersRefreshToken);
  router.get('/resetPassword/', shouldNotBeAuth, getUsersResetPassword);
  router.get('/resetPassword/resend/', shouldNotBeAuth, getUsersResetPasswordResend);
  router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
  router.get('/me', shouldBeAuth, shouldBeConfirmed, getUsersMe);
  router.get('/me/updateEmail/', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmail);
  router.get('/me/updateEmail/resend/', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmailResend);
  router.get('/me/updateEmail/confirm/', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmailConfirm);
  router.get('/me/updateEmail/confirm/resend/', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmailConfirmResend);
  router.put('/me/updateEmail/', shouldBeAuth, shouldBeConfirmed, putUsersMeUpdateEmail);
  router.put('/me/updatePassword/', shouldBeAuth, shouldBeConfirmed, putUsersMeUpdatePassword);
  router.post('/me/profilePictures/', shouldBeAuth, shouldBeConfirmed, uploadFile, postUsersMeProfilePictures(io));
  router.get('/me/profilePictures/', shouldBeAuth, shouldBeConfirmed, getUsersMeProfilePictures);
  router.get('/me/profilePictures/:id/', shouldBeAuth, shouldBeConfirmed, getUsersMeProfilePicturesId);
  router.put('/me/profilePictures/:id/', shouldBeAuth, shouldBeConfirmed, putUsersMeProfilePicturesId);
  router.delete('/me/profilePictures/:id/', shouldBeAuth, shouldBeConfirmed, deleteUsersMeProfilePicturesId);
  router.get('/logout/', shouldBeAuth, shouldBeConfirmed, getUsersLogout);
  router.get('/id/:id', shouldBeAuth, shouldBeConfirmed, getUsersIdId);

  router.get('/name/:userName/', (_req, res) => {
    res.end();
    // TODO:
    // should be authenticated
    // should find user
    // authTokenVersions should match
    // should be confirmed
    // should return users by params.userName match exect current
    // should return relevent attributes
    // should include current profile picture
    // should include original/croped/pending current profile picture
    // should include signed urls
  });
  router.put('/blacklist/:id/', shouldBeAuth, shouldBeConfirmed); // need to be login, confirmed and admin, remove or put user into blacklist
  router.get('/blacklist/'); // find all users in black list
  router.put('/admin/:id/', shouldBeAuth, shouldBeConfirmed); // need admin_password and be login and confirmed
  router.get('/admin/'); // find all admin
  router.get('/me/blacklist/'); // get all blacklisted users
  router.put('/me/blacklist/:id/'); // put a user to current user blacklist
  router.get('/me/blacklist/:id/');
  router.delete('/me/blacklist/:id/'); // remove user to current user blacklist
  // Login with Facebook
  // Login with Google

  return router;
};

export default usersRoutes;

// To log in, create an global accessToken = ''
// After logged in/confirm => accessToken = res.accessToken
// https://www.youtube.com/watch?v=25GS0MLT8JU&ab_channel=BenAwad
// 2:11:42
// https://medium.com/swlh/authentication-using-jwt-and-refresh-token-part-1-aca5522c14c8
// https://medium.com/swlh/authentication-using-jwt-and-refresh-token-part-2-a86150d25152

// socket io store image progression
// https://stackoverflow.com/questions/20631994/socket-io-emit-progress-check

// delete every files
// https://stackoverflow.com/questions/54959059/google-cloud-storage-nodejs-how-to-delete-a-folder-and-all-its-content

// https://github.com/visionmedia/supertest/issues/46
