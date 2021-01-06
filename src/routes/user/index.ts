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

router.get('/', shouldBeAuth, shouldBeConfirmed, getUsers); // Get all users, need to be admin
router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation); // Confirm account
router.get('/login', shouldNotBeAuth, postUsersLogin); // Login, send accessToken and refreshToken
router.post('/refreshToken', postUsersRefreshToken); // Refresh a token
router.post('/signin/', shouldNotBeAuth, postUsersSignin); // Sign in, create a user and send a confirm email
router.get('/me', shouldBeAuth, shouldBeConfirmed, (__, res) => {
  const { user } = res.locals;
  res.status(200).send(user);
});

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

// To log in, create an global accessToken = ''
// After logged in/confirm => accessToken = res.accessToken
// https://www.youtube.com/watch?v=25GS0MLT8JU&ab_channel=BenAwad
// 2:11:42
