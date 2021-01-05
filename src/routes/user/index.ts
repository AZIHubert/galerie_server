import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeConfirmed,
  shouldNotBeAuth,
} from '@src/helpers/middlewares';

import {
  getUsers,
  postUsersSignin,
  postUsersLogin,
  postUsersRefreshToken,
  putUsersConfirmation,
} from './routes';

const router = Router();

router.get('/', shouldBeAuth, shouldBeConfirmed, getUsers); // need to be admin
router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
router.get('/login', shouldNotBeAuth, postUsersLogin);
router.post('/refreshToken', postUsersRefreshToken);
router.post('/signin/', shouldNotBeAuth, postUsersSignin);

// TODO:
router.get('/:userName/', shouldBeAuth, shouldBeConfirmed); // Find multiples users by userName
router.get('/sendResetPassword/'); // need body email and send an email
router.put('/resetPassword/'); // need body password and token match
router.get('/:id/', shouldBeAuth, shouldBeConfirmed); // need to be login and confirmed
router.get('/:id/sendChangeEmail', shouldBeAuth, shouldBeConfirmed); // need password and new email and send email and be logged in
router.put('/:id/email'); // Need to jwt
router.put('/:id/profilePicture', shouldBeAuth, shouldBeConfirmed); // Need to be logged in and new picture OR old picture
router.get('/logout/', shouldBeAuth, shouldBeConfirmed); // need to be login and confirmed
router.delete('/user/:id', shouldBeAuth, shouldBeConfirmed); // need to be login, confirmed and id match
router.delete('/user/:id/blacklist', shouldBeAuth, shouldBeConfirmed); // need to be login, confirmed and admin
router.put('/:id/admin', shouldBeAuth, shouldBeConfirmed); // need admin_password and be login and confirmed

// Login with Facebook
// Login with Google

export default router;
