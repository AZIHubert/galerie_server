import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  NotificationBetaKeyUsed,
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
  createNotificationBetaKeyUsed,
  createNotificationFrameLiked,
  createNotificationFramePosted,
  createNotificationRoleChange,
  createNotificationUserSubscribe,
  createUser,
  getNotificationsId,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/notifications', () => {
  describe('/:notificationId', () => {
    describe('GET', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const {
            user: createdUser,
          } = await createUser({
            role: 'superAdmin',
          });
          user = createdUser;
          const jwt = signAuthToken(user);
          token = jwt.token;
        } catch (err) {
          done(err);
        }
        done();
      });

      afterAll(async (done) => {
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
        describe('where type === \'BETA_KEY_USED\'', () => {
          it('normalize notification', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: notificationId } = await createNotificationBetaKeyUsed({
              usedById: userTwo.id,
              userId: user.id,
            });
            const {
              body: {
                action,
                data: {
                  notification,
                },
              },
              status,
            } = await getNotificationsId(app, token, notificationId);
            expect(action).toBe('GET');
            expect(notification.createdAt).not.toBeUndefined();
            expect(notification.frameId).toBeUndefined();
            expect(notification.frame).toBeUndefined();
            expect(notification.galerieId).toBeUndefined();
            expect(notification.galerie).toBeUndefined();
            expect(notification.id).not.toBeUndefined();
            expect(notification.num).not.toBeUndefined();
            expect(notification.role).toBeUndefined();
            expect(notification.type).not.toBeUndefined();
            expect(notification.updatedAt).not.toBeUndefined();
            expect(notification.userId).toBeUndefined();
            expect(notification.users[0].hasNewNotifications).toBeUndefined();
            expect(status).toBe(200);
            testUser(notification.users[0]);
          });
          it('return a maximum of 4 users', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: notificationId } = await createNotificationBetaKeyUsed({
              usedById: userTwo.id,
              userId: user.id,
            });
            const arrayOfUsers = new Array(4).fill(0);
            await Promise.all(
              arrayOfUsers.map(
                async (_, index) => {
                  const {
                    user: {
                      id: userId,
                    },
                  } = await createUser({
                    email: `user${index + 3}@email.com`,
                    userName: `user${index + 3}`,
                  });
                  await NotificationBetaKeyUsed.create({
                    notificationId,
                    userId,
                  });
                },
              ),
            );
            const {
              body: {
                data: {
                  notification: {
                    users,
                  },
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(users.length).toBe(4);
          });
        });
        describe('where type === \'FRAME_LIKED\'', () => {
          it('normalize notification', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            const { id: notificationId } = await createNotificationFrameLiked({
              frameId,
              likedById: userTwo.id,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  notification,
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(notification.createdAt).not.toBeUndefined();
            expect(notification.frameId).toBeUndefined();
            expect(notification.frame.createdAt).toBeUndefined();
            expect(notification.frame.description).toBeUndefined();
            expect(notification.frame.galerieId).not.toBeUndefined();
            expect(notification.frame.id).not.toBeUndefined();
            expect(notification.frame.notificationHasBeenSend).toBeUndefined();
            expect(notification.frame.numOfLikes).toBeUndefined();
            expect(notification.frame.updatedAt).toBeUndefined();
            expect(notification.frame.userId).toBeUndefined();
            expect(notification.galerieId).toBeUndefined();
            expect(notification.galerie).toBeUndefined();
            expect(notification.id).not.toBeUndefined();
            expect(notification.num).not.toBeUndefined();
            expect(notification.role).toBeUndefined();
            expect(notification.type).not.toBeUndefined();
            expect(notification.updatedAt).not.toBeUndefined();
            expect(notification.userId).toBeUndefined();
            expect(notification.users[0].hasNewNotifications).toBeUndefined();
            testUser(notification.users[0]);
          });
          it('return a maximum of 4 users', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            const { id: frameId } = await createFrame({
              galerieId,
              userId: user.id,
            });
            const { id: notificationId } = await createNotificationFrameLiked({
              frameId,
              likedById: userTwo.id,
              userId: user.id,
            });
            const arrayOfUsers = new Array(4).fill(0);
            await Promise.all(
              arrayOfUsers.map(
                async (_, index) => {
                  const {
                    user: {
                      id: userId,
                    },
                  } = await createUser({
                    email: `user${index + 3}@email.com`,
                    userName: `user${index + 3}`,
                  });
                  await NotificationFrameLiked.create({
                    notificationId,
                    userId,
                  });
                },
              ),
            );
            const {
              body: {
                data: {
                  notification: {
                    users,
                  },
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(users.length).toBe(4);
          });
        });
        describe('where type === \'FRAME_POSTED\'', () => {
          it('normalize notification ', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            const { id: frameId } = await createFrame({
              galerieId,
              userId: userTwo.id,
            });
            const { id: notificationId } = await createNotificationFramePosted({
              frameId,
              galerieId,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  notification,
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(notification.createdAt).not.toBeUndefined();
            expect(notification.frameId).toBeUndefined();
            expect(notification.frame).toBeUndefined();
            expect(notification.frames[0].createdAt).toBeUndefined();
            expect(notification.frames[0].description).toBeUndefined();
            expect(notification.frames[0].galerieId).not.toBeUndefined();
            expect(notification.frames[0].id).not.toBeUndefined();
            expect(notification.frames[0].notificationHasBeenSend).toBeUndefined();
            expect(notification.frames[0].numOfLikes).toBeUndefined();
            expect(notification.frames[0].updatedAt).toBeUndefined();
            expect(notification.frames[0].userId).toBeUndefined();
            expect(notification.galerie.archived).toBeUndefined();
            expect(notification.galerie.createdAt).toBeUndefined();
            expect(notification.galerie.defaultCoverPicture).not.toBeUndefined();
            expect(notification.galerie.description).toBeUndefined();
            expect(notification.galerie.id).not.toBeUndefined();
            expect(notification.galerie.name).not.toBeUndefined();
            expect(notification.galerie.updatedAt).toBeUndefined();
            expect(notification.galerieId).toBeUndefined();
            expect(notification.id).not.toBeUndefined();
            expect(notification.num).not.toBeUndefined();
            expect(notification.role).toBeUndefined();
            expect(notification.type).not.toBeUndefined();
            expect(notification.updatedAt).not.toBeUndefined();
            expect(notification.userId).toBeUndefined();
            expect(notification.users).toBeUndefined();
          });
          it('return a maximum of 4 frames', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            const { id: frameId } = await createFrame({
              galerieId,
              userId: userTwo.id,
            });
            const { id: notificationId } = await createNotificationFramePosted({
              frameId,
              galerieId,
              userId: user.id,
            });
            const arrayOfFrames = new Array(4).fill(0);
            await Promise.all(
              arrayOfFrames.map(
                async () => {
                  const frame = await createFrame({
                    galerieId,
                    userId: userTwo.id,
                  });
                  await NotificationFramePosted.create({
                    frameId: frame.id,
                    notificationId,
                  });
                },
              ),
            );
            const {
              body: {
                data: {
                  notification: {
                    frames,
                  },
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(frames.length).toBe(4);
          });
        });
        describe('where type === \'ROLE_CHANGE\'', () => {
          it('normalize notification', async () => {
            const { id: notificationId } = await createNotificationRoleChange({
              role: 'superAdmin',
              userId: user.id,
            });
            const {
              body: {
                data: {
                  notification,
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(notification.createdAt).not.toBeUndefined();
            expect(notification.frameId).toBeUndefined();
            expect(notification.frame).toBeUndefined();
            expect(notification.frames).toBeUndefined();
            expect(notification.galerie).toBeUndefined();
            expect(notification.galerieId).toBeUndefined();
            expect(notification.id).not.toBeUndefined();
            expect(notification.num).toBeUndefined();
            expect(notification.role).not.toBeUndefined();
            expect(notification.type).not.toBeUndefined();
            expect(notification.updatedAt).not.toBeUndefined();
            expect(notification.userId).toBeUndefined();
            expect(notification.users).toBeUndefined();
          });
        });
        describe('where type === \'USER_SUBSCRIBE\'', () => {
          it('normalize notification', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            const { id: notificationId } = await createNotificationUserSubscribe({
              galerieId,
              subscribedUserId: userTwo.id,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  notification,
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(notification.createdAt).not.toBeUndefined();
            expect(notification.frameId).toBeUndefined();
            expect(notification.frame).toBeUndefined();
            expect(notification.frames).toBeUndefined();
            expect(notification.galerie.archived).toBeUndefined();
            expect(notification.galerie.createdAt).toBeUndefined();
            expect(notification.galerie.defaultCoverPicture).not.toBeUndefined();
            expect(notification.galerie.description).toBeUndefined();
            expect(notification.galerie.id).not.toBeUndefined();
            expect(notification.galerie.name).not.toBeUndefined();
            expect(notification.galerieId).toBeUndefined();
            expect(notification.id).not.toBeUndefined();
            expect(notification.num).not.toBeUndefined();
            expect(notification.role).toBeUndefined();
            expect(notification.type).not.toBeUndefined();
            expect(notification.updatedAt).not.toBeUndefined();
            expect(notification.userId).toBeUndefined();
            expect(notification.users[0].hasNewNotifications).toBeUndefined();
            testUser(notification.users[0]);
          });
          it('return a maximum of 4 users', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            const { id: notificationId } = await createNotificationUserSubscribe({
              galerieId,
              subscribedUserId: userTwo.id,
              userId: user.id,
            });
            const arrayOfUsers = new Array(4).fill(0);
            await Promise.all(
              arrayOfUsers.map(
                async (_, index) => {
                  const { user: newUser } = await createUser({
                    email: `user${index + 3}@email.com`,
                    userName: `user${index + 3}`,
                  });
                  await NotificationUserSubscribe.create({
                    notificationId,
                    userId: newUser.id,
                  });
                },
              ),
            );
            const {
              body: {
                data: {
                  notification: {
                    users,
                  },
                },
              },
            } = await getNotificationsId(app, token, notificationId);
            expect(users.length).toBe(4);
          });
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.notificationId is not a UUIDv4', async () => {
          const {
            body,
            status,
          } = await getNotificationsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('notification'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('notification not found', async () => {
          const {
            body,
            status,
          } = await getNotificationsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('notification'));
          expect(status).toBe(404);
        });
        it('notification exist but does not belong to currentUser', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: notificationId } = await createNotificationRoleChange({
            role: 'user',
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await getNotificationsId(app, token, notificationId);
          expect(body.errors).toBe(MODEL_NOT_FOUND('notification'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
