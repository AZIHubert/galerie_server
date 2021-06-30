import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  NotificationBetaKeyUsed,
  NotificationFrameLiked,
  NotificationFramePosted,
  NotificationUserSubscribe,
  User,
} from '#src/db/models';

import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createNotificationBetaKeyUsed,
  createNotificationFrameLiked,
  createNotificationFramePosted,
  createNotificationGalerieRoleChange,
  createNotificationRoleChange,
  createNotificationUserSubscribe,
  createUser,
  getNotifications,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/notifications', () => {
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
          role: 'admin',
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
      it('return no notifications', async () => {
        const {
          body: {
            action,
            data: {
              notifications,
            },
          },
          status,
        } = await getNotifications(app, token);
        expect(action).toBe('GET');
        expect(notifications.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return a pack of 6 notifications', async () => {
        const numOfNotifications = new Array(7).fill(0);
        await Promise.all(
          numOfNotifications.map(
            async () => {
              await createNotificationRoleChange({
                role: 'admin',
                userId: user.id,
              });
            },
          ),
        );
        const {
          body: {
            data: {
              notifications: firstPack,
            },
          },
        } = await getNotifications(app, token);
        const {
          body: {
            data: {
              notifications: secondPack,
            },
          },
        } = await getNotifications(app, token, {
          previousNotification: firstPack[firstPack.length - 1].autoIncrementId,
        });
        expect(firstPack.length).toBe(6);
        expect(secondPack.length).toBe(1);
      });
      it('order by updatedAt', async () => {
        const notificationOne = await createNotificationRoleChange({
          role: 'admin',
          userId: user.id,
        });
        const notificationTwo = await createNotificationRoleChange({
          role: 'admin',
          userId: user.id,
        });
        const notificationThree = await createNotificationRoleChange({
          role: 'admin',
          userId: user.id,
        });
        const notificationFour = await createNotificationRoleChange({
          role: 'admin',
          userId: user.id,
        });
        const notificationFive = await createNotificationRoleChange({
          role: 'admin',
          userId: user.id,
        });
        const {
          body: {
            data: {
              notifications,
            },
          },
        } = await getNotifications(app, token);
        expect(notifications[0].id).toBe(notificationFive.id);
        expect(notifications[1].id).toBe(notificationFour.id);
        expect(notifications[2].id).toBe(notificationThree.id);
        expect(notifications[3].id).toBe(notificationTwo.id);
        expect(notifications[4].id).toBe(notificationOne.id);
      });
      describe('should return first notifications if req.query.previousNotification', () => {
        let notificationId: string;

        beforeEach(async (done) => {
          try {
            await createNotificationRoleChange({
              role: 'admin',
              userId: user.id,
            });
            const notification = await createNotificationRoleChange({
              role: 'admin',
              userId: user.id,
            });
            notificationId = notification.id;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('is not a number', async () => {
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token, {
            previousNotification: 'notANumber',
          });
          expect(notifications.length).toBe(2);
          expect(notifications[0].id).toBe(notificationId);
        });
        it('is less than 0', async () => {
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token, {
            previousNotification: '-1',
          });
          expect(notifications.length).toBe(2);
          expect(notifications[0].id).toBe(notificationId);
        });
      });
      describe('where type === \'BETA_KEY_USED\'', () => {
        it('normalize notification', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createNotificationBetaKeyUsed({
            usedById: userTwo.id,
            userId: user.id,
          });
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token);
          expect(notifications[0].autoIncrementId).not.toBeUndefined();
          expect(notifications[0].createdAt).not.toBeUndefined();
          expect(notifications[0].frameId).toBeUndefined();
          expect(notifications[0].frame).toBeUndefined();
          expect(notifications[0].galerieId).toBeUndefined();
          expect(notifications[0].galerie).toBeUndefined();
          expect(notifications[0].id).not.toBeUndefined();
          expect(notifications[0].num).not.toBeUndefined();
          expect(notifications[0].role).toBeUndefined();
          expect(notifications[0].type).not.toBeUndefined();
          expect(notifications[0].updatedAt).not.toBeUndefined();
          expect(notifications[0].userId).toBeUndefined();
          expect(notifications[0].users[0].hasNewNotifications).toBeUndefined();
          testUser(notifications[0].users[0]);
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
                notifications: [{
                  users,
                }],
              },
            },
          } = await getNotifications(app, token);
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
          await createNotificationFrameLiked({
            frameId,
            likedById: userTwo.id,
            userId: user.id,
          });
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token);
          expect(notifications[0].autoIncrementId).not.toBeUndefined();
          expect(notifications[0].createdAt).not.toBeUndefined();
          expect(notifications[0].frameId).toBeUndefined();
          expect(notifications[0].frame.createdAt).toBeUndefined();
          expect(notifications[0].frame.description).toBeUndefined();
          expect(notifications[0].frame.galerieId).not.toBeUndefined();
          expect(notifications[0].frame.id).not.toBeUndefined();
          expect(notifications[0].frame.notificationHasBeenSend).toBeUndefined();
          expect(notifications[0].frame.numOfLikes).toBeUndefined();
          expect(notifications[0].frame.updatedAt).toBeUndefined();
          expect(notifications[0].frame.userId).toBeUndefined();
          expect(notifications[0].galerieId).toBeUndefined();
          expect(notifications[0].galerie).toBeUndefined();
          expect(notifications[0].id).not.toBeUndefined();
          expect(notifications[0].num).not.toBeUndefined();
          expect(notifications[0].role).toBeUndefined();
          expect(notifications[0].type).not.toBeUndefined();
          expect(notifications[0].updatedAt).not.toBeUndefined();
          expect(notifications[0].userId).toBeUndefined();
          expect(notifications[0].users[0].hasNewNotifications).toBeUndefined();
          testUser(notifications[0].users[0]);
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
                notifications: [{
                  users,
                }],
              },
            },
          } = await getNotifications(app, token);
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
          await createNotificationFramePosted({
            frameId,
            galerieId,
            userId: user.id,
          });
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token);
          expect(notifications[0].autoIncrementId).not.toBeUndefined();
          expect(notifications[0].createdAt).not.toBeUndefined();
          expect(notifications[0].frameId).toBeUndefined();
          expect(notifications[0].frame).toBeUndefined();
          expect(notifications[0].frames[0].createdAt).toBeUndefined();
          expect(notifications[0].frames[0].description).toBeUndefined();
          expect(notifications[0].frames[0].galerieId).not.toBeUndefined();
          expect(notifications[0].frames[0].id).not.toBeUndefined();
          expect(notifications[0].frames[0].notificationHasBeenSend).toBeUndefined();
          expect(notifications[0].frames[0].numOfLikes).toBeUndefined();
          expect(notifications[0].frames[0].updatedAt).toBeUndefined();
          expect(notifications[0].frames[0].userId).toBeUndefined();
          expect(notifications[0].galerie.archived).toBeUndefined();
          expect(notifications[0].galerie.createdAt).toBeUndefined();
          expect(notifications[0].galerie.defaultCoverPicture).not.toBeUndefined();
          expect(notifications[0].galerie.description).toBeUndefined();
          expect(notifications[0].galerie.id).not.toBeUndefined();
          expect(notifications[0].galerie.name).not.toBeUndefined();
          expect(notifications[0].galerie.updatedAt).toBeUndefined();
          expect(notifications[0].galerieId).toBeUndefined();
          expect(notifications[0].id).not.toBeUndefined();
          expect(notifications[0].num).not.toBeUndefined();
          expect(notifications[0].role).toBeUndefined();
          expect(notifications[0].type).not.toBeUndefined();
          expect(notifications[0].updatedAt).not.toBeUndefined();
          expect(notifications[0].userId).toBeUndefined();
          expect(notifications[0].users).toBeUndefined();
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
                notifications: [{
                  frames,
                }],
              },
            },
          } = await getNotifications(app, token);
          expect(frames.length).toBe(4);
        });
      });
      describe('where type === \'GALERIE_ROLE_CHANGE\'', () => {
        it('normalize notification', async () => {
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await createNotificationGalerieRoleChange({
            galerieId,
            role: 'admin',
            userId: user.id,
          });
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token);
          expect(notifications[0].autoIncrementId).not.toBeUndefined();
          expect(notifications[0].createdAt).not.toBeUndefined();
          expect(notifications[0].frameId).toBeUndefined();
          expect(notifications[0].frame).toBeUndefined();
          expect(notifications[0].galerie.archived).toBeUndefined();
          expect(notifications[0].galerie.createdAt).toBeUndefined();
          expect(notifications[0].galerie.defaultCoverPicture).not.toBeUndefined();
          expect(notifications[0].galerie.description).toBeUndefined();
          expect(notifications[0].galerie.id).not.toBeUndefined();
          expect(notifications[0].galerie.name).not.toBeUndefined();
          expect(notifications[0].galerie.updatedAt).toBeUndefined();
          expect(notifications[0].galerieId).toBeUndefined();
          expect(notifications[0].id).not.toBeUndefined();
          expect(notifications[0].num).toBeUndefined();
          expect(notifications[0].role).not.toBeUndefined();
          expect(notifications[0].type).not.toBeUndefined();
          expect(notifications[0].updatedAt).not.toBeUndefined();
          expect(notifications[0].userId).toBeUndefined();
          expect(notifications[0].users).toBeUndefined();
        });
      });
      describe('where type === \'ROLE_CHANGE\'', () => {
        it('normalize notification', async () => {
          await createNotificationRoleChange({
            role: 'admin',
            userId: user.id,
          });
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token);
          expect(notifications[0].autoIncrementId).not.toBeUndefined();
          expect(notifications[0].createdAt).not.toBeUndefined();
          expect(notifications[0].frameId).toBeUndefined();
          expect(notifications[0].frame).toBeUndefined();
          expect(notifications[0].frames).toBeUndefined();
          expect(notifications[0].galerie).toBeUndefined();
          expect(notifications[0].galerieId).toBeUndefined();
          expect(notifications[0].id).not.toBeUndefined();
          expect(notifications[0].num).toBeUndefined();
          expect(notifications[0].role).not.toBeUndefined();
          expect(notifications[0].type).not.toBeUndefined();
          expect(notifications[0].updatedAt).not.toBeUndefined();
          expect(notifications[0].userId).toBeUndefined();
          expect(notifications[0].users).toBeUndefined();
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
          await createNotificationUserSubscribe({
            galerieId,
            subscribedUserId: userTwo.id,
            userId: user.id,
          });
          const {
            body: {
              data: {
                notifications,
              },
            },
          } = await getNotifications(app, token);
          expect(notifications[0].autoIncrementId).not.toBeUndefined();
          expect(notifications[0].createdAt).not.toBeUndefined();
          expect(notifications[0].frameId).toBeUndefined();
          expect(notifications[0].frame).toBeUndefined();
          expect(notifications[0].frames).toBeUndefined();
          expect(notifications[0].galerie.archived).toBeUndefined();
          expect(notifications[0].galerie.createdAt).toBeUndefined();
          expect(notifications[0].galerie.defaultCoverPicture).not.toBeUndefined();
          expect(notifications[0].galerie.description).toBeUndefined();
          expect(notifications[0].galerie.id).not.toBeUndefined();
          expect(notifications[0].galerie.name).not.toBeUndefined();
          expect(notifications[0].galerieId).toBeUndefined();
          expect(notifications[0].id).not.toBeUndefined();
          expect(notifications[0].num).not.toBeUndefined();
          expect(notifications[0].role).toBeUndefined();
          expect(notifications[0].type).not.toBeUndefined();
          expect(notifications[0].updatedAt).not.toBeUndefined();
          expect(notifications[0].userId).toBeUndefined();
          expect(notifications[0].users[0].hasNewNotifications).toBeUndefined();
          testUser(notifications[0].users[0]);
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
                notifications: [{
                  users,
                }],
              },
            },
          } = await getNotifications(app, token);
          expect(users.length).toBe(4);
        });
      });
    });
  });
});
