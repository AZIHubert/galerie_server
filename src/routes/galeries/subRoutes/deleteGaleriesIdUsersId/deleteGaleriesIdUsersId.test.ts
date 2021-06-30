import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GalerieUser,
  GaleriePicture,
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
  deleteGaleriesIdUsersId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
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

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('/:userId', () => {
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
              } = await createUser({
                role: 'admin',
              });
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
                const {
                  user: createdUser,
                } = await createUser({
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

            it('delete model GalerieUser', async () => {
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    userId: returnedUserId,
                  },
                },
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const galerieUser = await GalerieUser.findOne({
                where: {
                  galerieId,
                  userId: userTwo.id,
                },
              });
              expect(action).toBe('DELETE');
              expect(galerieUser).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedUserId).toBe(userTwo.id);
              expect(status).toBe(200);
            });
            it('delete all frames/galeriePictures/images posted by the deleted user', async () => {
              const createdFrame = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
            it('set createdById === null for all galerieBlackLists posted by the deleted user', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const galerieBlackList = await createGalerieBlackList({
                createdById: userTwo.id,
                galerieId,
                userId: userThree.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              await galerieBlackList.reload();
              expect(galerieBlackList.createdById).toBeNull();
            });
            it('do not set createdById === null for galerieBlackLists posted by other user', async () => {
              const { user: userThree } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const galerieBlackList = await createGalerieBlackList({
                createdById: user.id,
                galerieId,
                userId: userThree.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              await galerieBlackList.reload();
              expect(galerieBlackList.createdById).toBe(userTwo.id);
            });
            it('delete all likes posted on frames posted by the deleted user', async () => {
              const createdFrame = await createFrame({
                galerieId,
                userId: userTwo.id,
              });
              const { id: likeId } = await createLike({
                frameId: createdFrame.id,
                userId: user.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const like = await Like.findByPk(likeId);
              expect(like).toBeNull();
            });
            it('delete all likes posted by the deleted user', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              const { id: likeId } = await createLike({
                frameId,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const like = await Like.findByPk(likeId);
              expect(like).toBeNull();
            });
            it('decrement all frames.numOfLikes liked by the deleted user', async () => {
              const { id: frameId } = await createFrame({
                galerieId,
                userId: user.id,
              });
              await createLike({
                frameId,
                incrementNumOfLikes: true,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const frame = await Frame.findByPk(frameId) as Frame;
              expect(frame.numOfLikes).toBe(0);
            });
            it('destroy all invitation posted by the deleted user', async () => {
              const { id: invitationId } = await createInvitation({
                galerieId,
                userId: userTwo.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const invitation = await Invitation.findByPk(invitationId);
              expect(invitation).toBeNull();
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const notification = await Notification.findByPk(notificationId);
              expect(notification).toBeNull();
            });
            it('destroy all notifications where userSubscribe.userId === request.params.userId, num <= 1 && type === \'USER_SUSCBIBE\'', async () => {
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                subscribedUserId: userTwo.id,
                userId: user.id,
              });
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
            it('delete user if request.params.userId is an moderator and current user is the admin of this galerie', async () => {
              const {
                user: userThree,
              } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenThree } = signAuthToken(userThree);
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userThree.id,
              });
              const {
                status,
              } = await deleteGaleriesIdUsersId(app, tokenThree, galerieId, userTwo.id);
              expect(status).toBe(200);
            });
            describe('do not delete {{}} posted by other users', () => {
              it('frames', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const frame = await Frame.findByPk(frameId);
                expect(frame).not.toBeNull();
              });
              it('likes', async () => {
                const { id: frameId } = await createFrame({
                  galerieId,
                  userId: user.id,
                });
                const { id: likeId } = await createLike({
                  frameId,
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const like = await Like.findByPk(likeId);
                expect(like).not.toBeNull();
              });
              it('invitations', async () => {
                const { id: invitationId } = await createInvitation({
                  galerieId,
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const invitation = await Invitation.findByPk(invitationId);
                expect(invitation).not.toBeNull();
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
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
                  userId: user.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
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
            });
            describe('do not delete {{}} from other galeries', () => {
              let galerieTwo: Galerie;

              beforeEach(async (done) => {
                try {
                  galerieTwo = await createGalerie({
                    name: 'galerie2',
                    userId: userTwo.id,
                  });
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('frames', async () => {
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const frame = await Frame.findByPk(frameId);
                expect(frame).not.toBeNull();
              });
              it('likes', async () => {
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                const { id: likeId } = await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const like = await Like.findByPk(likeId);
                expect(like).not.toBeNull();
              });
              it('invitations', async () => {
                const { id: invitationId } = await createInvitation({
                  galerieId: galerieTwo.id,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const invitation = await Invitation.findByPk(invitationId);
                expect(invitation).not.toBeNull();
              });
              it('notification where type === \'FRAME_LIKED\' && userId === request.params.userId', async () => {
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
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).not.toBeNull();
              });
              it('notification where type === \'FRAME_POSTED\' && userId === request.params.userId', async () => {
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
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).not.toBeNull();
              });
              it('notification where type === \'USER_SUBSCRIBE\' && userId === request.params.userId', async () => {
                await createGalerieUser({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const { id: notificationId } = await createNotificationUserSubscribe({
                  galerieId: galerieTwo.id,
                  subscribedUserId: user.id,
                  userId: userTwo.id,
                });
                await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                const notification = await Notification.findByPk(notificationId);
                expect(notification).not.toBeNull();
              });
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('request.params.userId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('request.params.userId is the same as current user.id', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, user.id);
              expect(body.errors).toBe('you cannot delete yourself');
              expect(status).toBe(400);
            });
            it('the role of current user for this galerie is \'user\'', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you should be an moderator or the admin of this galerie to delete a user');
              expect(status).toBe(400);
            });
            it('user with :userId is the admin of this galerie', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
              await createGalerieUser({
                galerieId,
                role: 'moderator',
                userId: userTwo.id,
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you can\'t delete the admin of this galerie');
              expect(status).toBe(400);
            });
            it('user with :userId is a moderator and current user is a moderator', async () => {
              const {
                user: userTwo,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                user: userThree,
              } = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const { token: tokenTwo } = signAuthToken(userTwo);
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
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, userThree.id);
              expect(body.errors).toBe('you should be the admin of this galerie to delete an moderator');
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('galerie exist but current user is not subscribe to this galerie', async () => {
              const {
                user: userTwo,
              } = await createUser({
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
              } = await deleteGaleriesIdUsersId(app, token, galerieTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('user not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('user with id === :userId is not subscribe to this galerie', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
