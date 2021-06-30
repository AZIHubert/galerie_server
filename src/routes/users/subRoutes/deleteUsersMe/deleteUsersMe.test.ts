import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  BetaKey,
  BlackList,
  Frame,
  Galerie,
  GalerieBlackList,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  Like,
  Notification,
  NotificationBetaKeyUsed,
  NotificationFrameLiked,
  NotificationFramePosted,
  ProfilePicture,
  Report,
  ReportUser,
  User,
} from '#src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  WRONG_PASSWORD,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  createBlackList,
  createFrame,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createInvitation,
  createLike,
  createNotification,
  createNotificationBetaKeyUsed,
  createNotificationFrameLiked,
  createNotificationFramePosted,
  createProfilePicture,
  createReport,
  createTicket,
  createUser,
  deleteUsersMe,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let password: string;
let token: string;
let user: User;

jest.mock('#src/helpers/gc', () => ({
  __esModule: true,
  default: ({
    bucket: () => ({
      file: () => ({
        delete: () => Promise.resolve(),
      }),
    }),
  }),
}));

describe('/users', () => {
  describe('/me', () => {
    describe('DELETE', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        jest.clearAllMocks();
        try {
          await sequelize.sync({ force: true });
          const {
            password: createdPassword,
            user: createdUser,
          } = await createUser({
            role: 'admin',
          });
          password = createdPassword;
          user = createdUser;
          const jwt = signAuthToken(user);
          token = jwt.token;
        } catch (err) {
          done(err);
        }
        done();
      });

      afterAll(async (done) => {
        jest.clearAllMocks();
        try {
          await sequelize.sync({ force: true });
          await sequelize.close();
        } catch (err) {
          done(err);
        }
        app.close();
        done();
      });

      describe('should return status 200 and', () => {
        it('destoy all profile pictures/images posted by the currentUser', async () => {
          await createProfilePicture({
            userId: user.id,
          });
          const {
            body: {
              action,
            },
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const images = await Image.findAll();
          const profilePictures = await ProfilePicture.findAll();
          expect(action).toBe('DELETE');
          expect(images.length).toBe(0);
          expect(profilePictures.length).toBe(0);
          expect(status).toBe(200);
        });
        it('set ticket.userId === null for all tickets created by the currentUser', async () => {
          const ticket = await createTicket({
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await ticket.reload();
          expect(status).toBe(200);
          expect(ticket.userId).toBeNull();
        });
        it('destoy all blackList where userId === currentUser.id', async () => {
          await createBlackList({
            active: false,
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const blackLists = await BlackList.findAll();
          expect(blackLists.length).toBe(0);
          expect(status).toBe(200);
        });
        it('set blackList.createdById === null to all blackLists posted by the current user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const blackList = await createBlackList({
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await blackList.reload();
          expect(blackList.createdById).toBeNull();
          expect(status).toBe(200);
        });
        it('set blackList.updatedById === null to all blackLists updated by the current user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const blackList = await createBlackList({
            updatedById: user.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await blackList.reload();
          expect(blackList.updatedById).toBeNull();
          expect(status).toBe(200);
        });
        it('delete all frames/galeriePictures/images posted by the current users', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          await createFrame({
            galerieId,
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const frames = await Frame.findAll();
          const galeriePictures = await GaleriePicture.findAll();
          const images = await Image.findAll();
          expect(frames.length).toBe(0);
          expect(galeriePictures.length).toBe(0);
          expect(images.length).toBe(0);
          expect(status).toBe(200);
        });
        it('delete likes posted on frames posted by the current user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          await createLike({
            frameId,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const likes = await Like.findAll();
          expect(likes.length).toBe(0);
          expect(status).toBe(200);
        });
        it('delete likes posted by the currentUser', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: userTwo.id,
          });
          await createLike({
            frameId,
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const likes = await Like.findAll();
          expect(likes.length).toBe(0);
          expect(status).toBe(200);
        });
        it('delete all galerieUser where userId === currentUser.id', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const galerieUser = await GalerieUser.findAll({
            where: {
              userId: user.id,
            },
          });
          expect(galerieUser.length).toBe(0);
          expect(status).toBe(200);
        });
        it('destroy galerie if the currentUser was the creator and the last user remain', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const galerie = await Galerie.findByPk(galerieId);
          const galerieUsers = await GalerieUser.findAll({
            where: {
              userId: user.id,
            },
          });
          expect(galerie).toBeNull();
          expect(galerieUsers.length).toBe(0);
          expect(status).toBe(200);
        });
        it('destroy galerie if the currentUser was the last user remain', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          await GalerieUser.destroy({
            where: {
              galerieId,
              userId: userTwo.id,
            },
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const galerie = await Galerie.findByPk(galerieId);
          const galerieUsers = await GalerieUser.findAll({
            where: {
              userId: user.id,
            },
          });
          expect(galerie).toBeNull();
          expect(galerieUsers.length).toBe(0);
          expect(status).toBe(200);
        });
        it('destoy all invitations from the galerie even posted by other user if the creator was the last user subscribe to it', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await createGalerieUser({
            galerieId,
            role: 'moderator',
            userId: userTwo.id,
          });
          await createInvitation({
            galerieId,
            userId: user.id,
          });
          await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const invitations = await Invitation.findAll();
          expect(invitations.length).toBe(0);
          expect(status).toBe(200);
        });
        it('set galerie.archived === true if he was the creator of this galerie and it was still other users subscribe to it', async () => {
          const galerie = await createGalerie({
            userId: user.id,
          });
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createGalerieUser({
            galerieId: galerie.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const galerieUser = await GalerieUser.findOne({
            where: {
              galerieId: galerie.id,
              userId: userTwo.id,
            },
          });
          await galerie.reload();
          expect(galerie.archived).toBe(true);
          expect(galerieUser).not.toBeNull();
          expect(status).toBe(200);
        });
        it('destroy all invitation to the galeries where user was the creator and there is still users subscribe to it', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await createGalerieUser({
            galerieId,
            userId: userTwo.id,
          });
          await createInvitation({
            galerieId,
            userId: user.id,
          });
          await createInvitation({
            galerieId,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const invitations = await Invitation.findAll();
          expect(invitations.length).toBe(0);
          expect(status).toBe(200);
        });
        it('destroy all invitations posted by the currentUser', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          await createInvitation({
            galerieId,
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const invitations = await Invitation.findAll();
          expect(invitations.length).toBe(0);
          expect(status).toBe(200);
        });
        it('set galerieBlackList.createdById === null to all galerieBlackList posted by this user', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            role: 'moderator',
            userId: user.id,
          });
          const galerieBlackList = await createGalerieBlackList({
            galerieId,
            userId: userThree.id,
            createdById: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await galerieBlackList.reload();
          expect(galerieBlackList.createdById).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy all galerieBlackList where userId === currentUser.id', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await createGalerieBlackList({
            createdById: userTwo.id,
            galerieId,
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const galerieBlackLists = await GalerieBlackList.findAll();
          expect(galerieBlackLists.length).toBe(0);
          expect(status).toBe(200);
        });
        it('destroy all non used betaKey posted by the currentUser', async () => {
          await createBetaKey({
            createdById: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const betaKeys = await BetaKey.findAll();
          expect(betaKeys.length).toBe(0);
          expect(status).toBe(200);
        });
        it('set betaKey.createdById === null to all used betaKey created by the currentUser', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const betaKey = await createBetaKey({
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await betaKey.reload();
          expect(betaKey.createdById).toBeNull();
          expect(status).toBe(200);
        });
        it('destoy betakey used by the current user', async () => {
          await createBetaKey({
            userId: user.id,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const betaKeys = await BetaKey.findAll();
          expect(betaKeys.length).toBe(0);
          expect(status).toBe(200);
        });
        it('destoy all notifications where notification.userId === currentUser.id', async () => {
          await createNotification({
            type: 'BETA_KEY_USED',
            userId: user.id,
          });
          await createNotification({
            type: 'FRAME_LIKED',
            userId: user.id,
          });
          await createNotification({
            type: 'FRAME_POSTED',
            userId: user.id,
          });
          await createNotification({
            type: 'USER_SUBSCRIBE',
            userId: user.id,
          });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(0);
        });
        it('destroy all notificationFramePosted where num <= 1 && frameId was posted by the currentUser', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          const { id: notificationId } = await createNotificationFramePosted({
            frameId,
            galerieId,
            userId: userTwo.id,
          });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const notification = await Notification.findByPk(notificationId);
          const notificationsFramePosted = await NotificationFramePosted.findAll();
          expect(notification).toBeNull();
          expect(notificationsFramePosted.length).toBe(0);
        });
        it('decrement notification.num where type === \'FRAME_POSTED\' where num > 1 && frameId was posted by the currentUser', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          await createGalerieUser({
            galerieId,
            userId: userThree.id,
          });
          const frameOne = await createFrame({
            galerieId,
            userId: user.id,
          });
          const frameTwo = await createFrame({
            galerieId,
            userId: userThree.id,
          });
          const notification = await createNotificationFramePosted({
            frameId: frameOne.id,
            galerieId,
            userId: userTwo.id,
          });
          await NotificationFramePosted.create({
            frameId: frameTwo.id,
            notificationId: notification.id,
          });
          await notification.increment({ num: 1 });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await notification.reload();
          const notificationFramePosted = await NotificationFramePosted.findOne({
            where: {
              notificationId: notification.id,
              frameId: frameOne.id,
            },
          });
          expect(notification.num).toBe(1);
          expect(notificationFramePosted).toBeNull();
        });
        it('destroy all notificationBetaKeyUsed where num <= 1 betaKeyUsed.userId === currentUser.id', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            role: 'moderator',
            userName: 'user2',
          });
          const { id: notificationId } = await createNotificationBetaKeyUsed({
            usedById: user.id,
            userId: userTwo.id,
          });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const notification = await Notification.findByPk(notificationId);
          const notificationsBetaKeyUsed = await NotificationBetaKeyUsed.findAll();
          expect(notification).toBeNull();
          expect(notificationsBetaKeyUsed.length).toBe(0);
        });
        it('decrement notification.num for notification where num > 1 && betaKeyUsed.userId === currentUser.id', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            role: 'moderator',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            role: 'moderator',
            userName: 'user3',
          });
          const notification = await createNotificationBetaKeyUsed({
            usedById: user.id,
            userId: userTwo.id,
          });
          await NotificationBetaKeyUsed.create({
            notificationId: notification.id,
            userId: userThree.id,
          });
          await notification.increment({ num: 1 });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await notification.reload();
          const notificationBetaKeyUsed = await NotificationBetaKeyUsed.findOne({
            where: {
              notificationId: notification.id,
              userId: user.id,
            },
          });
          expect(notification.num).toBe(1);
          expect(notificationBetaKeyUsed).toBeNull();
        });
        it('destroy all notificationFrameLikes where num <= 1 frameLiked.userId === currentUser.id', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: userTwo.id,
          });
          await createLike({
            frameId,
            userId: user.id,
          });
          const { id: notificationId } = await createNotificationFrameLiked({
            frameId,
            likedById: user.id,
            userId: userTwo.id,
          });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const notification = await Notification.findByPk(notificationId);
          const notificationsFrameLiked = await NotificationFrameLiked.findAll();
          expect(notification).toBeNull();
          expect(notificationsFrameLiked.length).toBe(0);
        });
        it('decrement all notification where type === \'FRAME_LIKED\',  num > 1 frameLiked.userId === currentUser.id', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          await createGalerieUser({
            galerieId,
            userId: user.id,
          });
          await createGalerieUser({
            galerieId,
            userId: userThree.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: userTwo.id,
          });
          await createLike({
            frameId,
            userId: user.id,
          });
          await createLike({
            frameId,
            userId: userThree.id,
          });
          const notification = await createNotificationFrameLiked({
            frameId,
            likedById: user.id,
            userId: userTwo.id,
          });
          await NotificationFrameLiked.create({
            notificationId: notification.id,
            userId: userThree.id,
          });
          await notification.increment({ num: 1 });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          await notification.reload();
          const notificationFrameLiked = await NotificationFrameLiked.findOne({
            where: {
              notificationId: notification.id,
              userId: user.id,
            },
          });
          expect(notification.num).toBe(1);
          expect(notificationFrameLiked).toBeNull();
        });
        it('destroy report where report.profilePictureId was posted by currentUser', async () => {
          const { id: profilePictureId } = await createProfilePicture({
            userId: user.id,
          });
          const { id: reportId } = await createReport({
            profilePictureId,
          });
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const report = await Report.findByPk(reportId);
          expect(report).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy reportUsers where', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          const { id: reportId } = await createReport({
            frameId,
            userId: user.id,
          });
          await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const reportUser = await ReportUser.findOne({
            where: {
              reportId,
              userId: user.id,
            },
          });
          expect(reportUser).toBeNull();
        });
        it('destroy the current user', async () => {
          const {
            status,
          } = await deleteUsersMe(app, token, {
            body: {
              deleteAccountSentence: 'delete my account',
              password,
              userNameOrEmail: user.email,
            },
          });
          const users = await User.findAll();
          expect(status).toBe(200);
          expect(users.length).toBe(0);
        });

        describe('do not', () => {
          let userTwo: User;
          beforeEach(async (done) => {
            try {
              const { user: newUser } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              userTwo = newUser;
            } catch (err) {
              done(err);
            }
            done();
          });
          it('destroy profile pictures/images from other users', async () => {
            await createProfilePicture({
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const images = await Image.findAll();
            const profilePictures = await ProfilePicture.findAll();
            expect(images.length).toBeTruthy();
            expect(profilePictures.length).toBe(1);
            expect(status).toBe(200);
          });
          it('set ticket.user === null for tickets created by other users', async () => {
            const ticket = await createTicket({
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            await ticket.reload();
            expect(status).toBe(200);
            expect(ticket.userId).toBe(userTwo.id);
          });
          it('destroy other blackList', async () => {
            await createBlackList({
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const blackLists = await BlackList.findAll();
            expect(blackLists.length).toBe(1);
            expect(status).toBe(200);
          });
          it('set blackList.createdById === null to all blackLists posted by other users', async () => {
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const blackList = await createBlackList({
              createdById: userTwo.id,
              userId: userThree.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            await blackList.reload();
            expect(blackList.createdById).toBe(userTwo.id);
            expect(status).toBe(200);
          });
          it('set blackList.createdById === null to all blackList updated by other users', async () => {
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const blackList = await createBlackList({
              updatedById: userTwo.id,
              userId: userThree.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            await blackList.reload();
            expect(blackList.updatedById).toBe(userTwo.id);
            expect(status).toBe(200);
          });
          it('delete frames/galeriePictures/images posted by other users', async () => {
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            await createFrame({
              galerieId,
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const frames = await Frame.findAll();
            const galeriePictures = await GaleriePicture.findAll();
            const images = await Image.findAll();
            expect(frames.length).toBe(1);
            expect(galeriePictures.length).toBeTruthy();
            expect(images.length).toBeTruthy();
            expect(status).toBe(200);
          });
          it('delete likes posted by other users', async () => {
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            const { id: frameId } = await createFrame({
              galerieId,
              userId: userTwo.id,
            });
            const { id: likeId } = await createLike({
              frameId,
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const like = await Like.findByPk(likeId);
            expect(like).not.toBeNull();
            expect(status).toBe(200);
          });
          it('delete galereUser from other users', async () => {
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const { id: galerieId } = await createGalerie({
              userId: userThree.id,
            });
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const galerieUsers = await GalerieUser.findAll({
              where: {
                userId: userTwo.id,
              },
            });
            expect(galerieUsers.length).toBe(1);
            expect(status).toBe(200);
          });
          it('destroy the galerie if there is still other users subscribe to it', async () => {
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            await createGalerieUser({
              galerieId,
              userId: user.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const galerie = await Galerie.findByPk(galerieId);
            expect(galerie).not.toBeNull();
            expect(status).toBe(200);
          });
          it('set galerie.archived === true if he wasn\'t the creator og this galerie and it was still other users subscribe to it', async () => {
            const galerie = await createGalerie({
              userId: userTwo.id,
            });
            await createGalerieUser({
              galerieId: galerie.id,
              userId: user.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            await galerie.reload();
            expect(galerie.archived).toBe(false);
            expect(status).toBe(200);
          });
          it('destroy invitation posted by other users', async () => {
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            await createInvitation({
              galerieId,
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const invitations = await Invitation.findAll();
            expect(invitations.length).toBe(1);
            expect(status).toBe(200);
          });
          it('set galerieBlackList.createdById === null to all galerieBlackList posted by other users', async () => {
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const galerieBlackList = await createGalerieBlackList({
              createdById: userTwo.id,
              galerieId,
              userId: userThree.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            await galerieBlackList.reload();
            expect(galerieBlackList.createdById).toBe(userTwo.id);
            expect(status).toBe(200);
          });
          it('destroy all galerieBlackList where userId !== currentUser.id', async () => {
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const { id: galerieId } = await createGalerie({
              userId: userTwo.id,
            });
            await createGalerieBlackList({
              createdById: userTwo.id,
              galerieId,
              userId: userThree.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const galerieBlackLists = await GalerieBlackList.findAll();
            expect(galerieBlackLists.length).toBe(1);
            expect(status).toBe(200);
          });
          it('destroy all non used betaKey posted by other users', async () => {
            await createBetaKey({
              createdById: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const betaKeys = await BetaKey.findAll();
            expect(betaKeys.length).toBe(1);
            expect(status).toBe(200);
          });
          it('set betaKey.createdById === null to all used betaKey created by other users', async () => {
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const betaKey = await createBetaKey({
              createdById: userTwo.id,
              userId: userThree.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            await betaKey.reload();
            expect(betaKey.createdById).toBe(userTwo.id);
            expect(status).toBe(200);
          });
          it('destroy betaKey used by other users', async () => {
            await createBetaKey({
              userId: userTwo.id,
            });
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const betaKeys = await BetaKey.findAll();
            expect(betaKeys.length).toBe(1);
            expect(status).toBe(200);
          });
          it('destoy other user', async () => {
            const {
              status,
            } = await deleteUsersMe(app, token, {
              body: {
                deleteAccountSentence: 'delete my account',
                password,
                userNameOrEmail: user.email,
              },
            });
            const users = await User.findAll();
            expect(status).toBe(200);
            expect(users.length).toBe(1);
          });
        });
      });
      describe('should return status 400 if', () => {
        it('user was registered through Facebook', async () => {
          const {
            password: passwordTwo,
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            facebookId: '1',
            userName: 'user2',
          });
          const { token: tokenTwo } = signAuthToken(userTwo);
          const {
            body,
            status,
          } = await deleteUsersMe(app, tokenTwo, {
            body: {
              deleteAccountSentence: 'delete my account',
              password: passwordTwo,
              userNameOrEmail: userTwo.email,
            },
          });
          expect(body.errors).toBe('you can\'t delete your account if you\'re logged in with Facebook or Google');
          expect(status).toBe(400);
        });
        it('user was registered through Google', async () => {
          const {
            password: passwordTwo,
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            googleId: '1',
            userName: 'user2',
          });
          const { token: tokenTwo } = signAuthToken(userTwo);
          const {
            body,
            status,
          } = await deleteUsersMe(app, tokenTwo, {
            body: {
              deleteAccountSentence: 'delete my account',
              password: passwordTwo,
              userNameOrEmail: userTwo.email,
            },
          });
          expect(body.errors).toBe('you can\'t delete your account if you\'re logged in with Facebook or Google');
          expect(status).toBe(400);
        });
        describe('request.body', () => {
          describe('.deleteAccountSentence', () => {
            it('is not send', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  password,
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                deleteAccountSentence: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 1234,
                  password,
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                deleteAccountSentence: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: '',
                  password,
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                deleteAccountSentence: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('do not match \'delete my account\'', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'wrong sentence',
                  password,
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                deleteAccountSentence: 'wrong sentence',
              });
              expect(status).toBe(400);
            });
          });
          describe('.password', () => {
            it('is not send', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                password: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password: 1234,
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                password: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password: '',
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                password: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('do not match user.password', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password: 'wrongPassword',
                  userNameOrEmail: user.email,
                },
              });
              expect(body.errors).toEqual({
                password: WRONG_PASSWORD,
              });
              expect(status).toBe(400);
            });
          });
          describe('.userNameOrEmail', () => {
            it('is not send', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password,
                },
              });
              expect(body.errors).toEqual({
                userNameOrEmail: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password,
                  userNameOrEmail: 1234,
                },
              });
              expect(body.errors).toEqual({
                userNameOrEmail: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password,
                  userNameOrEmail: '',
                },
              });
              expect(body.errors).toEqual({
                userNameOrEmail: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('do not match user.email or user.userName', async () => {
              const {
                body,
                status,
              } = await deleteUsersMe(app, token, {
                body: {
                  deleteAccountSentence: 'delete my account',
                  password,
                  userNameOrEmail: 'wrongEmail',
                },
              });
              expect(body.errors).toEqual({
                userNameOrEmail: 'wrong user name or email',
              });
              expect(status).toBe(400);
            });
          });
        });
      });
    });
  });
});
