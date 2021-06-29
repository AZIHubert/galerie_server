import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GalerieBlackList,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  Like,
  Notification,
  NotificationFrameLiked,
  NotificationFramePosted,
  NotificationUserSubscribe,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createInvitation,
  createLike,
  createNotificationFrameLiked,
  createNotificationFramePosted,
  createNotificationUserSubscribe,
  createUser,
  deleteGaleriesUnsubscribe,
  deleteUsersMe,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/gc', () => ({
  __esModule: true,
  default: ({
    bucket: () => ({
      file: () => ({
        delete: () => Promise.resolve(),
      }),
    }),
  }),
}));

let app: Server;
let galerieId: string;
let passwordTwo: string;
let sequelize: Sequelize;
let token: string;
let tokenTwo: string;
let user: User;
let userTwo: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/unsubscribe', () => {
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
              user: createdUser,
            } = await createUser({});
            const {
              password: createdPasswordTwo,
              user: createdUserTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });

            passwordTwo = createdPasswordTwo;
            user = createdUser;
            userTwo = createdUserTwo;

            const jwt = signAuthToken(user);
            const jwtTwo = signAuthToken(userTwo);

            token = jwt.token;
            tokenTwo = jwtTwo.token;

            const galerie = await createGalerie({
              userId: userTwo.id,
            });
            galerieId = galerie.id;
            await createGalerieUser({
              galerieId,
              userId: user.id,
            });
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
          it('destroy GalerieUser model', async () => {
            const {
              body: {
                action,
                data,
              },
              status,
            } = await deleteGaleriesUnsubscribe(app, token, galerieId);
            const galerieUser = await GalerieUser.findOne({
              where: {
                galerieId,
                userId: user.id,
              },
            });
            expect(action).toBe('DELETE');
            expect(data).toEqual({
              galerieId,
            });
            expect(galerieUser).toBeNull();
            expect(status).toBe(200);
          });
          describe('do not destroy {{}} posted by other user', () => {
            it('frame/galerie pictures/images', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const frame = await Frame.findByPk(frameId);
              expect(frame).not.toBeNull();
            });
            it('galerieBlackList', async () => {
              const { id: galerieBlackListId } = await createGalerieBlackList({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
              expect(galerieBlackList).not.toBeNull();
            });
            it('invitations', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).not.toBeNull();
            });
            it('likes', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              const { id: likeId } = await createLike({
                frameId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const like = await Like.findByPk(likeId);
              expect(like).not.toBeNull();
            });
            it('notification where type === \'FRAME_LIKED\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
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
                userId: userThree.id,
              });
              const notification = await createNotificationFrameLiked({
                frameId,
                likedById: userThree.id,
                userId: userThree.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              const notificationFrameLiked = await NotificationFrameLiked.findOne({
                where: {
                  notificationId: notification.id,
                  userId: userThree.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationFrameLiked).not.toBeNull();
            });
            it('notification where type === \'FRAME_POSTED\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                userId: userThree.id,
              });
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userThree.id,
              });
              const notification = await createNotificationFramePosted({
                frameId,
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              const notificationFramePosted = await NotificationFramePosted.findOne({
                where: {
                  frameId,
                  notificationId: notification.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationFramePosted).not.toBeNull();
            });
            it('notification where type === \'USER_SUBSCRIBE\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                userId: userThree.id,
              });
              const notification = await createNotificationUserSubscribe({
                galerieId,
                subscribedUserId: userThree.id,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  userId: userThree.id,
                  notificationId: notification.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationUserSubscribe).not.toBeNull();
            });
          });
          describe('do not delete {{}} from other galeries', () => {
            let galerieTwo: Galerie;

            beforeEach(async (done) => {
              try {
                galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: user.id,
                });
              } catch (err) {
                done(err);
              }
              done();
            });

            it('frames', async () => {
              const { id: frameId } = await createFrame({
                galerieId: galerieTwo.id,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const frame = await Frame.findByPk(frameId);
              expect(frame).not.toBeNull();
            });
            it('galerieBlackLists', async () => {
              const { id: galerieBlackListId } = await createGalerieBlackList({
                createdById: user.id,
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
              expect(galerieBlackList).not.toBeNull();
            });
            it('invitations', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId: galerieTwo.id,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).not.toBeNull();
            });
            it('likes', async () => {
              const { id: frameId } = await createFrame({
                galerieId: galerieTwo.id,
                userId: user.id,
              });
              const { id: likeId } = await createLike({
                frameId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const like = await Like.findByPk(likeId);
              expect(like).not.toBeNull();
            });
            it('notification where type === \'FRAME_LIKED\'', async () => {
              await createGalerieUser({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              await createLike({
                frameId,
                userId: user.id,
              });
              const notification = await createNotificationFrameLiked({
                frameId,
                likedById: user.id,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              const notificationFrameLiked = await NotificationFrameLiked.findOne({
                where: {
                  notificationId: notification.id,
                  userId: user.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationFrameLiked).not.toBeNull();
            });
            it('notification where type === \'FRAME_POSTED\'', async () => {
              await createGalerieUser({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const { id: frameId } = await createFrame({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const notification = await createNotificationFramePosted({
                frameId,
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              const notificationFramePosted = await NotificationFramePosted.findOne({
                where: {
                  frameId,
                  notificationId: notification.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationFramePosted).not.toBeNull();
            });
            it('notification where type === \'USER_SUBSCRIBE\'', async () => {
              await createGalerieUser({
                galerieId: galerieTwo.id,
                userId: userTwo.id,
              });
              const notification = await createNotificationUserSubscribe({
                galerieId: galerieTwo.id,
                subscribedUserId: user.id,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: notification.id,
                  userId: user.id,
                },
              });
              expect(notification.num).toBe(1);
              expect(notificationUserSubscribe).not.toBeNull();
            });
          });
          describe('if there is still at least a user left', () => {
            it('do not delete galerie', async () => {
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const galeries = await Galerie.findByPk(galerieId);
              expect(galeries).not.toBeNull();
            });
            it('destroy all frames/galerie pictures/images posted by this user', async () => {
              const frameOne = await createFrame({
                galerieId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const frame = await Frame.findByPk(frameOne.id);
              const galeriePictures = await GaleriePicture.findAll({
                where: {
                  id: frameOne.galeriePictures
                    .map((galeriePicture) => galeriePicture.id),
                },
              });
              const images = await Image.findAll({
                where: {
                  id: frameOne.galeriePictures
                    .map((galeriePicture) => galeriePicture.originalImageId),
                },
              });
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
            });
            it('decrement all frames.numOfLikes liked by the deleted user', async () => {
              const {
                id: frameId,
              } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await createLike({
                frameId,
                incrementNumOfLikes: true,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const frame = await Frame.findByPk(frameId) as Frame;
              expect(frame.numOfLikes).toBe(0);
            });
            it('set galerieBlackList.createdById === null for galerieBlackList posted by this user', async () => {
              const galerieBlackList = await createGalerieBlackList({
                createdById: user.id,
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await galerieBlackList.reload();
              expect(galerieBlackList.createdById).toBeNull();
            });
            it('destroy all likes to frames posted by deleted user', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const like = await Like.findOne({
                where: {
                  frameId,
                },
              });
              expect(like).toBeNull();
            });
            it('destroy all likes posted by this user', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await createLike({
                frameId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const like = await Like.findOne({
                where: {
                  frameId,
                },
              });
              expect(like).toBeNull();
            });
            it('destroy all invitations posted by this user', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).toBeNull();
            });
            it('delete all notification where type === \'FRAME_LIKED\', userId === currentUser.id, and frameLiked was posted on this galerie', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId,
                userId: userTwo.id,
              });
              const { id: notificationId } = await createNotificationFrameLiked({
                frameId,
                likedById: userTwo.id,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notification = await Notification.findByPk(notificationId);
              const notificationFrameLiked = await NotificationFrameLiked.findOne({
                where: {
                  notificationId,
                },
              });
              expect(notification).toBeNull();
              expect(notificationFrameLiked).toBeNull();
            });
            it('delete all notification where type === \'FRAME_POSTED\', userId === currentUser.id, and galerieId === request.body.galerieId', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              const { id: notificationId } = await createNotificationFramePosted({
                frameId,
                galerieId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notification = await Notification.findByPk(notificationId);
              const notificationFramePosted = await NotificationFramePosted.findOne({
                where: {
                  notificationId,
                },
              });
              expect(notification).toBeNull();
              expect(notificationFramePosted).toBeNull();
            });
            it('delete all notification where type === \'USER_SUBSCRIBE\', userId === currentUser.id, and galerieId === request.body.galerieId', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                userId: userThree.id,
              });
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                subscribedUserId: userThree.id,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notification = await Notification.findByPk(notificationId);
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId,
                },
              });
              expect(notification).toBeNull();
              expect(notificationUserSubscribe).toBeNull();
            });
            it('destroy all notification through Models where frameLiked.userId === currentUser.id, num < 1 && type === \'FRAME_LIKED\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
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
                userId: userThree.id,
              });
              await NotificationFrameLiked.create({
                notificationId: notification.id,
                userId: userTwo.id,
              });
              await notification.increment({ num: 1 });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notificationFrameLiked = await NotificationFrameLiked.findOne({
                where: {
                  notificationId: notification.id,
                  userId: user.id,
                },
              });
              expect(notificationFrameLiked).toBeNull();
            });
            it('destoy all notification through Models where framePosted.frameId was posted by currentUser, num < 1 && type === \'FRAME_POSTED\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
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
                notificationId: notification.id,
                frameId: frameTwo.id,
              });
              await notification.increment({ num: 1 });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notificationFramePosted = await NotificationFramePosted.findOne({
                where: {
                  notificationId: notification.id,
                  frameId: frameOne.id,
                },
              });
              expect(notificationFramePosted).toBeNull();
            });
            it('destoy all notification through Models where userSubscribe.userId === currentUser.id, num < 1 && type === \'USER_SUBSCRIB\'', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                userId: userThree.id,
              });
              const notification = await createNotificationUserSubscribe({
                galerieId,
                subscribedUserId: user.id,
                userId: userTwo.id,
              });
              await NotificationUserSubscribe.create({
                notificationId: notification.id,
                userId: userThree.id,
              });
              await notification.increment({ num: 1 });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: notification.id,
                  userId: user.id,
                },
              });
              expect(notificationUserSubscribe).toBeNull();
            });
            it('delete notifications where type === \'FRAME_POSTED\' and num <= 1', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: notificationId } = await createNotificationFramePosted({
                frameId,
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notification = await Notification.findByPk(notificationId);
              expect(notification).toBeNull();
            });
            it('decrement notification.num where type === \'FRAME_POSTED\' and num > 1', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
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
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              expect(notification.num).toBe(1);
            });
            it('destoy notification where type === \'FRAME_LIKED\' and num <= 1', async () => {
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
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notification = await Notification.findByPk(notificationId);
              expect(notification).toBeNull();
            });
            it('decrement notification where type === \'FRAME_LIKED\' and num > 1', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
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
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              expect(notification.num).toBe(1);
            });
            it('delete notification where num <= 1 where type === \'USER_SUBSCRIBE\' and notificationsUserSubscribe.userId === currentUser.id', async () => {
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                subscribedUserId: user.id,
                userId: userTwo.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const notification = await Notification.findByPk(notificationId);
              expect(notification).toBeNull();
            });
            it('decrement notification.num where num > 1 type === \'USER_SUBSCRIBE\' and notificationsUserSubscribe.userId === currentUser.id', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              await createGalerieUser({
                galerieId,
                userId: userThree.id,
              });
              const notification = await createNotificationUserSubscribe({
                galerieId,
                subscribedUserId: user.id,
                userId: userTwo.id,
              });
              await NotificationUserSubscribe.create({
                notificationId: notification.id,
                userId: userTwo.id,
              });
              await notification.increment({ num: 1 });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              await notification.reload();
              expect(notification.num).toBe(1);
            });
          });
          describe('if there is no user left', () => {
            beforeEach(async (done) => {
              try {
                await deleteUsersMe(app, tokenTwo, {
                  body: {
                    deleteAccountSentence: 'delete my account',
                    password: passwordTwo,
                    userNameOrEmail: userTwo.email,
                  },
                });
              } catch (err) {
                done(err);
              }
              done();
            });
            it('delete galerie', async () => {
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const galerie = await Galerie.findByPk(galerieId);
              expect(galerie).toBeNull();
            });
            it('destroy all galerieBlackList', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { id: galerieBlackListId } = await createGalerieBlackList({
                galerieId,
                userId: userThree.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
              expect(galerieBlackList).toBeNull();
            });
            it('destroy all frames/galerie pictures/images', async () => {
              const createdFrame = await createFrame({
                galerieId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const frame = await Frame.findByPk(createdFrame.id);
              const galeriePictures = await GaleriePicture.findAll({
                where: {
                  id: createdFrame.galeriePictures
                    .map((galeriePicture) => galeriePicture.id),
                },
              });
              const images = await Image.findAll({
                where: {
                  id: createdFrame.galeriePictures
                    .map((galeriePicture) => galeriePicture.originalImageId),
                },
              });
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
            });
            it('destroy all likes', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: likeId } = await createLike({
                frameId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const like = await Like.findByPk(likeId);
              expect(like).toBeNull();
            });
            it('destroy all invitations', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: user.id,
              });
              await deleteGaleriesUnsubscribe(app, token, galerieId);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).toBeNull();
            });
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesUnsubscribe(app, tokenTwo, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
          it('current user is the creator of this galerie', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesUnsubscribe(app, tokenTwo, galerieId);
            expect(body.errors).toBe('you cannot unsubscribe a galerie you\'ve created');
            expect(status).toBe(400);
          });
        });
        describe('should status error 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesUnsubscribe(app, tokenTwo, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('galerie exist but user is not subscribe to it', async () => {
            const galerie = await createGalerie({
              name: 'galerie2',
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await deleteGaleriesUnsubscribe(app, token, galerie.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
