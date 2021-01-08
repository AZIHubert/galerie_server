import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeConfirmed,
  shouldNotBeAuth,
} from '@src/helpers/middlewares';

import {
  getUsers,
  getUsersMe,
  getUsersMeUpdateEmail,
  getUsersMeSendUpdateNewEmail,
  getUsersResetPassword,
  postUsersSignin,
  postUsersLogin,
  postUsersRefreshToken,
  putUsersConfirmation,
  putUsersResetPassword,
} from './routes';

const router = Router();

router.get('/', shouldBeAuth, shouldBeConfirmed, getUsers); // TODO: need to be admin
router.post('/signin/', shouldNotBeAuth, postUsersSignin);
router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
router.get('/login', shouldNotBeAuth, postUsersLogin);
router.post('/refreshToken', postUsersRefreshToken);
router.get('/resetPassword/', shouldNotBeAuth, getUsersResetPassword);
router.put('/resetPassword/', shouldNotBeAuth, putUsersResetPassword);
router.get('/me', shouldBeAuth, shouldBeConfirmed, getUsersMe);
router.get('/me/updateEmail', shouldBeAuth, shouldBeConfirmed, getUsersMeUpdateEmail);
// TODO: sign in token newEmailTokenVersion, rename route => get me/updateEmail/confirm
router.get('/me/sendUpdateNewEmail', shouldBeAuth, shouldBeConfirmed, getUsersMeSendUpdateNewEmail);
router.put('/me/updateEmail', shouldBeAuth, shouldBeConfirmed, () => {
  // should verify if logged
  // should verify if confirmed
  // should verify token -> id, tokenversion, email
});

// TODO:
router.get('/reSendConfirmPassword', shouldNotBeAuth); // route if user want to resend password, should get body.email, check if user exist and not confirm
router.get('/me/reSendUpdateEmail'); // route if user want to resend to current email
router.get('/me/reSendUpdateNewEmail');
router.put('/me/updatePassword', shouldBeAuth, shouldBeConfirmed); // should get current password, new password, confirm new password
router.put('/me/profilePicture', shouldBeAuth, shouldBeConfirmed); // Need to be logged in and new picture OR old picture
router.delete('/me', shouldBeAuth, shouldBeConfirmed); // need to be login, confirmed and id match
router.get('/:userName/', shouldBeAuth, shouldBeConfirmed); // Find multiples users by userName
router.get('/logout/', shouldBeAuth, shouldBeConfirmed); // need to be login and confirmed => sendRefreshToken(req, '')
router.delete('/user/:id/blacklist', shouldBeAuth, shouldBeConfirmed); // need to be login, confirmed and admin
router.put('/:id/admin', shouldBeAuth, shouldBeConfirmed); // need admin_password and be login and confirmed

// Login with Facebook
// Login with Google

export default router;

// To log in, create an global accessToken = ''
// After logged in/confirm => accessToken = res.accessToken
// https://www.youtube.com/watch?v=25GS0MLT8JU&ab_channel=BenAwad
// 2:11:42
// https://medium.com/swlh/authentication-using-jwt-and-refresh-token-part-1-aca5522c14c8
// https://medium.com/swlh/authentication-using-jwt-and-refresh-token-part-2-a86150d25152

// TODO:
// update name's route
