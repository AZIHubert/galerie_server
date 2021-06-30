import { Router } from 'express';

import {
  shouldBeAuth,
  shouldBeAdmin,
  shouldBeModerator,
  shouldNotBeAuth,
  shouldNotBeGoogleOrFacebookUser,
} from '#src/helpers/middlewares';

import {
  deleteUsersIdProfilePicturesId,
  deleteUsersMe,

  getUsers,
  getUsersId,
  getUsersIdBlackLists,
  getUsersIdBlackListsId,
  getUsersIdCurrentProfilePicture,
  getUsersIdProfilePictures,
  getUsersIdProfilePicturesId,
  getUsersLogout,
  getUsersMe,
  getUsersMeCurrentProfilePicture,
  getUsersRefreshToken,

  postUsersConfirmation,
  postUsersIdBlackLists,
  postUsersIdProfilePicturesIdReports,
  postUsersLogin,
  postUsersLoginSocialMedia,
  postUsersMeEmail,
  postUsersMeEmailConfirm,
  postUsersPassword,
  postUsersSignin,
  postUsersSigninBeta,

  putUsersConfirmation,
  putUsersIdBlackLists,
  putUsersIdRole,
  putUsersMeEmail,
  putUsersMeHasNewNotifications,
  putUsersMePseudonym,
  putUsersMePassword,
  putUsersPassword,
} from './subRoutes';

const router = Router();

const usersRoutes: () => Router = () => {
  router.delete('/me/', shouldBeAuth, deleteUsersMe);
  router.delete('/:userId/profilePictures/:profilePictureId', shouldBeAuth, shouldBeModerator, deleteUsersIdProfilePicturesId);

  router.get('/', shouldBeAuth, getUsers);
  router.get('/logout/', shouldBeAuth, getUsersLogout);
  router.get('/me/', shouldBeAuth, getUsersMe);
  router.get('/me/currentProfilePicture/', shouldBeAuth, getUsersMeCurrentProfilePicture);
  router.get('/refreshToken/', getUsersRefreshToken);
  router.get('/:userId/', shouldBeAuth, getUsersId);
  router.get('/:userId/blackLists', shouldBeAuth, shouldBeModerator, getUsersIdBlackLists);
  router.get('/:userId/blackLists/:blackListId', shouldBeAuth, shouldBeModerator, getUsersIdBlackListsId);
  router.get('/:userId/currentProfilePicture', shouldBeAuth, getUsersIdCurrentProfilePicture);
  router.get('/:userId/profilePictures', shouldBeAuth, shouldBeModerator, getUsersIdProfilePictures);
  router.get('/:userId/profilePictures/:profilePictureId', shouldBeAuth, shouldBeModerator, getUsersIdProfilePicturesId);

  router.post('/confirmation/', shouldNotBeAuth, postUsersConfirmation);
  router.post('/login/', shouldNotBeAuth, postUsersLogin);
  router.post('/login/socialMedia/', shouldNotBeAuth, postUsersLoginSocialMedia);
  router.post('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmail);
  router.post('/me/email/confirm/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, postUsersMeEmailConfirm);
  router.post('/password/', shouldNotBeAuth, postUsersPassword);
  router.post('/signin/', shouldNotBeAuth, postUsersSignin);
  router.post('/signin/beta', shouldNotBeAuth, postUsersSigninBeta);
  router.post('/:userId/blackLists', shouldBeAuth, shouldBeModerator, postUsersIdBlackLists);
  router.post('/:userId/profilePictures/:profilePictureId/reports/', shouldBeAuth, postUsersIdProfilePicturesIdReports);

  router.put('/confirmation/', shouldNotBeAuth, putUsersConfirmation);
  router.put('/me/email/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMeEmail);
  router.put('/me/hasNewNotifications', shouldBeAuth, putUsersMeHasNewNotifications);
  router.put('/me/password/', shouldBeAuth, shouldNotBeGoogleOrFacebookUser, putUsersMePassword);
  router.put('/me/pseudonym/', shouldBeAuth, putUsersMePseudonym);
  router.put('/password/', shouldNotBeAuth, putUsersPassword);
  router.put('/:userId/blackLists/', shouldBeAuth, shouldBeModerator, putUsersIdBlackLists);
  router.put('/:userId/role', shouldBeAuth, shouldBeAdmin, putUsersIdRole);

  return router;
};
export default usersRoutes;
