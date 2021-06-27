import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Notification,
  NotificationBetaKeyUsed,
} from '@src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signNotificationToken } from '@src/helpers/issueJWT';
import {
  createBetaKey,
  createNotification,
  createUser,
  postNotifications,
} from '@src/helpers/test';

import initApp from '@src/server';

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
        try {
          await sequelize.sync({ force: true });
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
          expect(notifications.length).toBe(0);
        });
        it('increment notification.num if notification already exist', async () => {
          const num = 1;
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
          const notification = await createNotification({
            type: 'BETA_KEY_USED',
            num,
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('BETA_KEY_USED', {
            betaKeyId: betaKey.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notificationsBetaKeyUsed = await NotificationBetaKeyUsed.findAll();
          await notification.reload();
          expect(notification.num).toBe(num + 1);
          expect(notifications.length).toBe(1);
          expect(notificationsBetaKeyUsed.length).toBe(1);
          expect(notificationsBetaKeyUsed[0].notificationId).toBe(notification.id);
          expect(notificationsBetaKeyUsed[0].userId).toBe(userTwo.id);
        });
        it('create notification if notification doen\'t exist', async () => {
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
          expect(notifications.length).toBe(1);
          expect(notifications[0].num).toBe(1);
          expect(notifications[0].seen).toBe(false);
          expect(notifications[0].type).toBe('BETA_KEY_USED');
          expect(notifications[0].userId).toBe(user.id);
          expect(notificationsBetaKeyUsed.length).toBe(1);
          expect(notificationsBetaKeyUsed[0].notificationId).toBe(notifications[0].id);
          expect(notificationsBetaKeyUsed[0].userId).toBe(userTwo.id);
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
          expect(body.errors).toBe('notifications already send for this beta key');
          expect(status).toBe(400);
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
