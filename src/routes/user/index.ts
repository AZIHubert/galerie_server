import {
  Router, Request, Response, NextFunction,
} from 'express';
import multer from 'multer';
import socketIo from 'socket.io';

import {
  shouldBeAuth,
  shouldBeConfirmed,
  shouldNotBeAuth,
} from '@src/helpers/middlewares';

import {
  getUsers,
  getUsersConfirmationResend,
  getUsersMe,
  getUsersMeUpdateEmail,
  getUsersmeUpdateEmailResend,
  getUsersMeUpdateEmailConfirm,
  getUsersMeUpdateEmailConfirmResend,
  getUsersResetPassword,
  getUsersResetPasswordResend,
  postUsersLogin,
  postUsersRefreshToken,
  postUsersSignin,
  putUsersConfirmation,
  putUsersMeProfilePicturesUpload,
  putUsersMeUpdateEmail,
  putUsersMeUpdatePassword,
  putUsersResetPassword,
} from './routes';

const router = Router();

const uploadFile = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }).single('image');

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.message === 'Unexpected field') {
        return res.status(400).send({
          errors: 'something went wrong with attached file',
        });
      }
      return res.status(500).send(err);
    } if (err) {
      return res.status(500).send(err);
    }
    return next();
  });
};

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
  router.get('/me/updateEmail/resend/', shouldBeAuth, shouldBeConfirmed, getUsersmeUpdateEmailResend);
  router.get('/me/updateEmail/confirm/', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmailConfirm);
  router.get('/me/updateEmail/confirm/resend/', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmailConfirmResend);
  router.put('/me/updateEmail/', shouldBeAuth, shouldBeConfirmed, putUsersMeUpdateEmail);
  router.put('/me/updatePassword/', shouldBeAuth, shouldBeConfirmed, putUsersMeUpdatePassword);
  router.put('/me/profilePictures/upload', shouldBeAuth, shouldBeConfirmed, uploadFile, putUsersMeProfilePicturesUpload(io));

  router.put('/me/profilePictures/:id'); // change profile picture
  router.delete('/me/profilePictures/:id'); // delete profile picture
  router.get('/logout/', shouldBeAuth, shouldBeConfirmed); // need to be login and confirmed => sendRefreshToken(req, '')
  router.get('/user/:userName'); // search users by userName
  router.get('/user/:id'); // get user by id
  router.delete('/user/:id/blacklist', shouldBeAuth, shouldBeConfirmed); // need to be login, confirmed and admin
  router.put('/:id/admin', shouldBeAuth, shouldBeConfirmed); // need admin_password and be login and confirmed
  router.get('/me/blacklist'); // get all blacklisted users
  router.put('/me/blacklist/:id'); // put a user to current user blacklist
  router.delete('/me/blacklist/:id'); // remove user to current user blacklist
  // Login with Facebook
  // Login with Google
  // need to verify authTokenVersion on shouldBeAuthMiddleware

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
