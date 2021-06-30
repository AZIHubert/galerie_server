import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Frame,
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
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
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
  postGaleriesIdUserUserIdBlackLists,
  testGalerieBlackList,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

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

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('/:userId', () => {
        describe('/blackList', () => {
          describe('POST', () => {
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
                user = createdUser;
                const jwt = signAuthToken(user);
                token = jwt.token;
                const galerie = await createGalerie({
                  userId: user.id,
                });
                galerieId = galerie.id;
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
              let userTwo: User;

              beforeEach(async (done) => {
                try {
                  const { user: createdUser } = await createUser({
                    email: 'user2@email.com',
                    userName: 'user2',
                  });
                  userTwo = createdUser;
                  await createGalerieUser({
                    galerieId,
                    userId: userTwo.id,
                  });
                } catch (err) {
                  done(err);
                }
                done();
              });
              it('blackList a user', async () => {
                const {
                  body: {
                    action,
                    data: {
                      galerieBlackList,
                      galerieId: returnedGalerieId,
                      userId,
                    },
                  },
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const createdGAlerieBlackList = await GalerieBlackList
                  .findByPk(galerieBlackList.id);
                expect(action).toBe('POST');
                expect(createdGAlerieBlackList).not.toBeNull();
                expect(galerieBlackList.createdBy.hasNewNotifications).toBeUndefined();
                expect(galerieBlackList.user.hasNewNotifications).toBeUndefined();
                expect(returnedGalerieId).toBe(galerieId);
                expect(userId).toBe(userTwo.id);
                expect(status).toBe(200);
                testGalerieBlackList(galerieBlackList);
                testUser(galerieBlackList.createdBy);
                testUser(galerieBlackList.user);
              });
              it('delete GalerieUser', async () => {
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const galerieUser = await GalerieUser.findOne({
                  where: {
                    galerieId,
                    userId: userTwo.id,
                  },
                });
                expect(galerieUser).toBeNull();
              });
              it('do not destroy other GalerieUser', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: user.id,
                });
                const galerieThree = await createGalerie({
                  name: 'galerie3',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const galerieUserOne = await GalerieUser.findOne({
                  where: {
                    galerieId: galerieTwo.id,
                    userId: userTwo.id,
                  },
                });
                const galerieUserTwo = await GalerieUser.findOne({
                  where: {
                    galerieId: galerieThree.id,
                    userId: userTwo.id,
                  },
                });
                const galerieUserThree = await GalerieUser.findOne({
                  where: {
                    galerieId,
                    userId: user.id,
                  },
                });
                expect(galerieUserOne).not.toBeNull();
                expect(galerieUserTwo).not.toBeNull();
                expect(galerieUserThree).not.toBeNull();
              });
              it('blackList an moderator of this galerie if current user is the admin of this galerie', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'moderator',
                  userId: userThree.id,
                });
                const {
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                expect(status).toBe(200);
              });
              it('blackList a user even if is blackListed from other galeries', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: user.id,
                });
                await createGalerieBlackList({
                  createdById: user.id,
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                const {
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                expect(status).toBe(200);
              });
              it('delete all frames/galeriePictures/images posted by the black listed user', async () => {
                await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const frames = await Frame.findAll();
                const galeriePictures = await GaleriePicture.findAll();
                const images = await Image.findAll();
                expect(frames.length).toBe(0);
                expect(galeriePictures.length).toBe(0);
                expect(images.length).toBe(0);
              });
              it('do not delete frames/galeriePictures/images posted by other users', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieUser({
                  galerieId,
                  userId: userThree.id,
                });
                await createFrame({
                  galerieId,
                  userId: userThree.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const frames = await Frame.findAll();
                expect(frames.length).toBe(1);
              });
              it('do not delete frames/galeriePictures/images posted by the black listed user on other galeries', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const frames = await Frame.findAll();
                expect(frames.length).toBe(1);
              });
              it('do not set createdBy === null for galerieBlackLists posted by other user', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                const galerieBlackList = await createGalerieBlackList({
                  createdById: user.id,
                  galerieId,
                  userId: userThree.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await galerieBlackList.reload();
                expect(galerieBlackList.createdById).toBe(user.id);
              });
              it('do not set createdById === null for galerieBlackLists posted by the black listed user on other galeries', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                const galerieBlackList = await createGalerieBlackList({
                  createdById: userTwo.id,
                  galerieId: galerieTwo.id,
                  userId: userThree.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await galerieBlackList.reload();
                expect(galerieBlackList.createdById).toBe(userTwo.id);
              });
              it('delete all likes posted on frames posted by the black listed user', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const likes = await Like.findAll();
                expect(likes.length).toBe(0);
              });
              it('do not delete likes posted on frames posted by the black listed user on other galeries', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const likes = await Like.findAll();
                expect(likes.length).toBe(1);
              });
              it('delete all likes posted by the black listed user', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const likes = await Like.findAll();
                expect(likes.length).toBe(0);
              });
              it('decrement all frames.numOfLikes liked by the black listed user', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                await createLike({
                  frameId,
                  incrementNumOfLikes: true,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const frame = await Frame.findByPk(frameId) as Frame;
                expect(frame.numOfLikes).toBe(0);
              });
              it('do not delete likes posted by other user', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                await createLike({
                  frameId,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const likes = await Like.findAll();
                expect(likes.length).toBe(1);
              });
              it('do not delete likes posted by the black listed user on other galeries', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const likes = await Like.findAll();
                expect(likes.length).toBe(1);
              });
              it('delete all invitations posted by the black listed user', async () => {
                await createInvitation({
                  galerieId,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const invitations = await Invitation.findAll();
                expect(invitations.length).toBe(0);
              });
              it('do not delete invitations posted by other users', async () => {
                await createInvitation({
                  galerieId,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const invitations = await Invitation.findAll();
                expect(invitations.length).toBe(1);
              });
              it('do not delete invitations posted by the black listed user on other galeries', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                await createInvitation({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const invitations = await Invitation.findAll();
                expect(invitations.length).toBe(1);
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
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const like = await Like.findOne({
                  where: {
                    frameId,
                  },
                });
                expect(like).toBeNull();
              });
              it('set createdBy === null for all galerieBlackLists posted by the black listed user', async () => {
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                const galerieBlackList = await createGalerieBlackList({
                  createdById: userTwo.id,
                  galerieId,
                  userId: userThree.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await galerieBlackList.reload();
                expect(galerieBlackList.createdById).toBeNull();
              });
              it('destroy all notifications where type === \'FRAME_LIKED\', userId === request.params.userId, and frameLiked was posted on this galerie', async () => {
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
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                const notificationFrameLiked = await NotificationFrameLiked.findOne({
                  where: {
                    notificationId,
                  },
                });
                expect(notification).toBeNull();
                expect(notificationFrameLiked).toBeNull();
              });
              it('destroy all notifications where type === \'FRAME_POSTED\', userId === request.params.userId, and galerieId === request.body.galerieId', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                const { id: notificationId } = await createNotificationFramePosted({
                  frameId,
                  galerieId,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                const notificationFramePosted = await NotificationFramePosted.findOne({
                  where: {
                    notificationId,
                  },
                });
                expect(notification).toBeNull();
                expect(notificationFramePosted).toBeNull();
              });
              it('destroy all notifications where type === \'USER_SUBSCRIBE\', userId === request.params.userId, and galerieId === request.body.galerieId', async () => {
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
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                  where: {
                    notificationId,
                  },
                });
                expect(notification).toBeNull();
                expect(notificationUserSubscribe).toBeNull();
              });
              it('destroy all notifications where frameLiked.userId === request.params.userId, num <= 1 && type === \'FRAME_LIKED\'', async () => {
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
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).toBeNull();
              });
              it('destroy all notifications where framePosted.frameId was posted by request.params.userId, num <= 1 && type === \'FRAME_POSTED\'', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: userTwo.id,
                });
                const { id: notificationId } = await createNotificationFramePosted({
                  frameId,
                  galerieId,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).toBeNull();
              });
              it('destroy all notifications where userSubscribe.userId === request.params.userId, num <= 1 && type === \'USER_SUSCBIBE\'', async () => {
                const { id: notificationId } = await createNotificationUserSubscribe({
                  galerieId,
                  subscribedUserId: userTwo.id,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).toBeNull();
              });
              it('decrement all notifications where frameLiked.userId === request.params.userId, num > 1 && type === \'FRAME_LIKED\'', async () => {
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
                  userId: user.id,
                });
                await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: userThree.id,
                });
                const notification = await createNotificationFrameLiked({
                  frameId,
                  likedById: userTwo.id,
                  userId: user.id,
                });
                await NotificationFrameLiked.create({
                  notificationId: notification.id,
                  userId: userThree.id,
                });
                await notification.increment({ num: 1 });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await notification.reload();
                const notificationFrameLiked = await NotificationFrameLiked.findOne({
                  where: {
                    notificationId: notification.id,
                    userId: userTwo.id,
                  },
                });
                expect(notification.num).toBe(1);
                expect(notificationFrameLiked).toBeNull();
              });
              it('decrement all notifications where framePosted.frameId was posted on by request.params.userId, num > 1 && type === \'FRAME_POSTED\'', async () => {
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
                  userId: userTwo.id,
                });
                const frameTwo = await createFrame({
                  galerieId,
                  userId: userThree.id,
                });
                const notification = await createNotificationFramePosted({
                  frameId: frameOne.id,
                  galerieId,
                  userId: user.id,
                });
                await NotificationFramePosted.create({
                  frameId: frameTwo.id,
                  notificationId: notification.id,
                });
                await notification.increment({ num: 1 });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await notification.reload();
                const notificationFramePosted = await NotificationFramePosted.findOne({
                  where: {
                    frameId: frameOne.id,
                    notificationId: notification.id,
                  },
                });
                expect(notification.num).toBe(1);
                expect(notificationFramePosted).toBeNull();
              });
              it('decrement all notifications where userSubscribe.userId === request.params.userId, num > 1 && type === \'USER_SUBSCRIBE\'', async () => {
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
                  subscribedUserId: userTwo.id,
                  userId: user.id,
                });
                await NotificationUserSubscribe.create({
                  notificationId: notification.id,
                  userId: userThree.id,
                });
                await notification.increment({ num: 1 });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await notification.reload();
                const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                  where: {
                    notificationId: notification.id,
                    userId: userTwo.id,
                  },
                });
                expect(notification.num).toBe(1);
                expect(notificationUserSubscribe).toBeNull();
              });
              it('do not destroy notification where type === \'Frame_LIKED\' posted by other users', async () => {
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
                  userId: user.id,
                });
                await createLike({
                  frameId,
                  userId: userThree.id,
                });
                const notification = await createNotificationFrameLiked({
                  frameId,
                  likedById: userThree.id,
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
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
              it('do not destroy notification where type === \'FRAME_POSTED\' posted by other users', async () => {
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
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
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
              it('do not destroy notification where type === \'USER_SUBSCRIBE\' posted by other users', async () => {
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
                  userId: user.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                await notification.reload();
                const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                  where: {
                    notificationId: notification.id,
                    userId: userThree.id,
                  },
                });
                expect(notification.num).toBe(1);
                expect(notificationUserSubscribe).not.toBeNull();
              });
              it('do not destroy notification where type === \'FRAME_LIKED\' && userId === request.params.userId from other galerie', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
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
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).not.toBeNull();
              });
              it('do not destroy notification where type === \'FRAME_POSTED\' && userId === request.params.userId from other galerie', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const { id: notificationId } = await createNotificationFramePosted({
                  frameId,
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).not.toBeNull();
              });
              it('do not destroy notification where type === \'USER_SUBSCRIBE\' && userId === request.params.userId from other galeries', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const { id: notificationId } = await createNotificationUserSubscribe({
                  galerieId: galerieTwo.id,
                  subscribedUserId: user.id,
                  userId: userTwo.id,
                });
                await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).not.toBeNull();
              });
            });
            describe('should return status 400 if', () => {
              it('request.body.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, '100', '100');
                expect(body.errors).toBe(INVALID_UUID('galerie'));
                expect(status).toBe(400);
              });
              it('request.body.userId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, '100');
                expect(body.errors).toBe(INVALID_UUID('user'));
                expect(status).toBe(400);
              });
              it('currentUser.id === request.body.userId', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, user.id);
                expect(body.errors).toBe('you can\'t black list yourself');
                expect(status).toBe(400);
              });
              it('current user\'s role for this galerie is \'user\'', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId,
                  userId: userThree.id,
                });
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(
                  app,
                  tokenTwo,
                  galerieId,
                  userThree.id,
                );
                expect(body.errors).toBe('you\'re not allow to black list a user from this galerie');
                expect(status).toBe(400);
              });
              it('user is the admin of this galerie', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'moderator',
                  userId: userTwo.id,
                });
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, tokenTwo, galerieId, user.id);
                expect(body.errors).toBe('the admin of this galerie can\'t be black listed');
                expect(status).toBe(400);
              });
              it('user and currentUser role for this galerie is \'moderator\'', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieUser({
                  galerieId,
                  role: 'moderator',
                  userId: userTwo.id,
                });
                await createGalerieUser({
                  galerieId,
                  role: 'moderator',
                  userId: userThree.id,
                });
                const { token: tokenTwo } = signAuthToken(userTwo);
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(
                  app,
                  tokenTwo,
                  galerieId,
                  userThree.id,
                );
                expect(body.errors).toBe('you\re not allow to black list an moderator');
                expect(status).toBe(400);
              });
              it('user is already blackListed', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
                await createGalerieBlackList({
                  createdById: user.id,
                  galerieId,
                  userId: userTwo.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                const galerieUser = await GalerieUser.findOne({
                  where: {
                    galerieId,
                    userId: userTwo.id,
                  },
                });
                expect(body.errors).toBe('this user is already black listed from this galerie');
                expect(galerieUser).toBeNull();
                expect(status).toBe(400);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, uuidv4(), uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('galerie exist but current user is not subscribe to it', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: userTwo.id,
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieTwo.id, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('user not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
                expect(status).toBe(404);
              });
              it('user exist but is not subscribed to this galerie', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body,
                  status,
                } = await postGaleriesIdUserUserIdBlackLists(app, token, galerieId, userTwo.id);
                expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});
