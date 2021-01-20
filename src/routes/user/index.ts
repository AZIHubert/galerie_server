import { Router } from 'express';
import socketIo from 'socket.io';

import {
  shouldBeAdmin,
  shouldBeAuth,
  shouldBeConfirmed,
  shouldBeSuperAdmin,
  shouldNotBeAuth,
  uploadFile,
} from '@src/helpers/middlewares';

import {
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
  postUsersLogin,
  postUsersRefreshToken,
  postUsersSignin,
  putUsersBlacklistId,
  putUsersConfirmation,
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
  router.get('/userName/:userName/', shouldBeAuth, shouldBeConfirmed, getUsersUserNameUserName);
  router.put('/role/:id/:role', shouldBeAuth, shouldBeConfirmed, shouldBeSuperAdmin, putUsersRoleIdRole);
  router.put('/blacklist/:id', shouldBeAuth, shouldBeConfirmed, shouldBeAdmin, putUsersBlacklistId);
  router.get('/blacklist/', shouldBeAuth, shouldBeConfirmed, shouldBeAdmin, getUsersBlackList);

  router.get('/me/blacklist/'); // get all blacklisted users
  router.put('/me/blacklist/:id/'); // put a user to current user blacklist
  router.get('/me/blacklist/:id/');
  router.delete('/me/blacklist/:id/'); // remove user to current user blacklist
  // Login with Facebook
  // Login with Google

  return router;
};

export default usersRoutes;

// After logged in/confirm => accessToken = res.accessToken
// https://www.youtube.com/watch?v=25GS0MLT8JU&ab_channel=BenAwad
// 2:11:42
// https://medium.com/swlh/authentication-using-jwt-and-refresh-token-part-1-aca5522c14c8
// https://medium.com/swlh/authentication-using-jwt-and-refresh-token-part-2-a86150d25152

// belongstomany
// https://medium.com/@tonyangelo9707/many-to-many-associations-using-sequelize-941f0b6ac102
