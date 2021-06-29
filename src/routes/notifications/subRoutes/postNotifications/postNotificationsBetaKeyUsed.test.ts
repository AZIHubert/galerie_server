import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Notification,
  NotificationBetaKeyUsed,
} from '#src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
  NOTIFICATION_ALREADY_SEND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signNotificationToken } from '#src/helpers/issueJWT';
import {
  createBetaKey,
  createNotificationBetaKeyUsed,
  createUser,
  postNotifications,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;

describe('/notifications', () => {
  describe('POST', () => {
    describe('with notificationtoken.type === \'BETA_KEY_USED\'', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        mockDate.reset();
        try {
          await sequelize.sync({ force: true });
        } catch (err) {
          done(err);
        }
        done();
      });

      afterAll(async (done) => {
        mockDate.reset();
        try {
          mockDate.reset();
          await sequelize.sync({ force: true });
          await sequelize.close();
        } catch (err) {
          done(err);
        }
        app.close();
        done();
      });

      describe('should return status 204 and', () => {
        it('set betaKey.notificationHasBeenSend to true', async () => {
          const { user } = await createUser({});
          const betaKey = await createBetaKey({
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: betaKey.id,
          });
          const { status } = await postNotifications(app, {
            notificationtoken,
          });
          await betaKey.reload();
          expect(betaKey.notificationHasBeenSend).toBe(true);
          expect(status).toBe(204);
        });
        it('do not create betaKey if betaKey.createdById === null', async () => {
          const { user } = await createUser({});
          const betaKey = await createBetaKey({
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: betaKey.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          await user.reload();
          expect(notifications.length).toBe(0);
          expect(user.hasNewNotifications).toBe(false);
        });
        describe('increment notification.num', () => {
          it('if notification already exist && seen === false', async () => {
            const num = 1;
            const { user } = await createUser({
              role: 'superAdmin',
            });
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const betaKey = await createBetaKey({
              createdById: user.id,
              userId: userThree.id,
            });
            const { id: notificationId } = await createNotificationBetaKeyUsed({
              num,
              usedById: userTwo.id,
              userId: user.id,
            });
            const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
              betaKeyId: betaKey.id,
            });
            await postNotifications(app, {
              notificationtoken,
            });
            const notificationBetaKeyUsedUserTwo = await NotificationBetaKeyUsed.findOne({
              where: {
                userId: userTwo.id,
              },
            }) as NotificationBetaKeyUsed;
            const notificationBetaKeyUsedUserThree = await NotificationBetaKeyUsed.findOne({
              where: {
                userId: userThree.id,
              },
            }) as NotificationBetaKeyUsed;
            const notifications = await Notification.findAll();
            const oldNotification = await Notification.findByPk(notificationId);
            await user.reload();
            expect(notificationBetaKeyUsedUserTwo).not.toBeNull();
            expect(notificationBetaKeyUsedUserTwo.notificationId).toBe(notifications[0].id);
            expect(notificationBetaKeyUsedUserThree).not.toBeNull();
            expect(notificationBetaKeyUsedUserThree.notificationId).toBe(notifications[0].id);
            expect(notifications.length).toBe(1);
            expect(notifications[0].num).toBe(num + 1);
            expect(notifications[0].userId).toBe(user.id);
            expect(oldNotification).toBeNull();
            expect(user.hasNewNotifications).toBe(true);
          });
          it('if notification exist && seen === true && was created there is 4 days or less', async () => {
            const num = 1;
            const { user } = await createUser({
              role: 'superAdmin',
            });
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            const betaKey = await createBetaKey({
              createdById: user.id,
              userId: userThree.id,
            });
            const { id: notificationId } = await createNotificationBetaKeyUsed({
              num,
              seen: true,
              usedById: userTwo.id,
              userId: user.id,
            });
            const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
              betaKeyId: betaKey.id,
            });
            await postNotifications(app, {
              notificationtoken,
            });
            const notificationBetaKeyUsedUserTwo = await NotificationBetaKeyUsed.findOne({
              where: {
                userId: userTwo.id,
              },
            }) as NotificationBetaKeyUsed;
            const notificationBetaKeyUsedUserThree = await NotificationBetaKeyUsed.findOne({
              where: {
                userId: userThree.id,
              },
            }) as NotificationBetaKeyUsed;
            const notifications = await Notification.findAll();
            const oldNotification = await Notification.findByPk(notificationId);
            await user.reload();
            expect(notificationBetaKeyUsedUserTwo).not.toBeNull();
            expect(notificationBetaKeyUsedUserTwo.notificationId).toBe(notifications[0].id);
            expect(notificationBetaKeyUsedUserThree).not.toBeNull();
            expect(notificationBetaKeyUsedUserThree.notificationId).toBe(notifications[0].id);
            expect(notifications.length).toBe(1);
            expect(notifications[0].num).toBe(num + 1);
            expect(notifications[0].userId).toBe(user.id);
            expect(oldNotification).toBeNull();
            expect(user.hasNewNotifications).toBe(true);
          });
        });
        describe('create notification', () => {
          it('if notification doen\'t exist', async () => {
            const { user } = await createUser({
              role: 'superAdmin',
            });
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const betaKey = await createBetaKey({
              createdById: user.id,
              userId: userTwo.id,
            });
            const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
              betaKeyId: betaKey.id,
            });
            await postNotifications(app, {
              notificationtoken,
            });
            const notifications = await Notification.findAll();
            const notificationsBetaKeyUsed = await NotificationBetaKeyUsed.findAll();
            await user.reload();
            expect(notifications.length).toBe(1);
            expect(notifications[0].num).toBe(1);
            expect(notifications[0].seen).toBe(false);
            expect(notifications[0].type).toBe('BETA_KEY_USED');
            expect(notifications[0].userId).toBe(user.id);
            expect(notificationsBetaKeyUsed.length).toBe(1);
            expect(notificationsBetaKeyUsed[0].notificationId).toBe(notifications[0].id);
            expect(notificationsBetaKeyUsed[0].userId).toBe(userTwo.id);
            expect(user.hasNewNotifications).toBe(true);
          });
          it('if notification exist && seen === true && was create there is more than 4 days', async () => {
            const num = 1;
            const timeStamp = 1434319925275;
            mockDate.set(timeStamp);
            const { user } = await createUser({
              role: 'superAdmin',
            });
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const betaKey = await createBetaKey({
              createdById: user.id,
              userId: userTwo.id,
            });
            const notification = await createNotificationBetaKeyUsed({
              num,
              seen: true,
              userId: user.id,
            });
            const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
              betaKeyId: betaKey.id,
            });
            mockDate.set(timeStamp + 1000 * 60 * 60 * 24 * 4 + 1);
            await postNotifications(app, {
              notificationtoken,
            });
            await notification.reload();
            const notifications = await Notification.findAll();
            expect(notification.num).toBe(1);
            expect(notification.seen).toBe(true);
            expect(notifications.length).toBe(2);
          });
        });
      });
      describe('should return status 400 if', () => {
        it('notificationtoken.data.betakeyId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: '100',
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(INVALID_UUID('beta key'));
          expect(status).toBe(400);
        });
        it('betaKey.notificationHasBeenSend === true', async () => {
          const { user } = await createUser({
            role: 'superAdmin',
          });
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const betaKey = await createBetaKey({
            createdById: user.id,
            notificationHasBeenSend: true,
            userId: userTwo.id,
          });
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: betaKey.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          await user.reload();
          expect(body.errors).toBe(NOTIFICATION_ALREADY_SEND('beta key'));
          expect(status).toBe(400);
          expect(user.hasNewNotifications).toBe(false);
        });
        it('betaKey.userId === null', async () => {
          const { user } = await createUser({});
          const betaKey = await createBetaKey({
            createdById: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: betaKey.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe('beta key should be used');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('betaKey doesn\'t exist', async () => {
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: uuidv4(),
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('beta key'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
