import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Notification,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signNotificationToken } from '@src/helpers/issueJWT';
import {
  createUser,
  postNotifications,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/notifications', () => {
  describe('POST', () => {
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
        await sequelize.sync({ force: true });
        await sequelize.close();
      } catch (err) {
        done(err);
      }
      app.close();
      done();
    });

    describe('where notificationtoken.type === \'ROLE_CHANGE\'', () => {
      describe('should return status 204 and', () => {
        it('do not create notification if user.role !== notificationtoken.data.role', async () => {
          const { user } = await createUser({
            role: 'user',
          });
          const { token: notificationtoken } = signNotificationToken('ROLE_CHANGE', {
            role: 'admin',
            userId: user.id,
          });
          const {
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          await user.reload();
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(0);
          expect(status).toBe(204);
          expect(user.hasNewNotifications).toBe(false);
        });
        it('create a notification with the new role of the user', async () => {
          const role = 'admin';
          const { user } = await createUser({
            role,
          });
          const { token: notificationtoken } = signNotificationToken('ROLE_CHANGE', {
            role,
            userId: user.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await user.reload();
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(1);
          expect(notifications[0].role).toBe(role);
          expect(notifications[0].seen).toBe(false);
          expect(notifications[0].type).toBe('ROLE_CHANGE');
          expect(notifications[0].userId).toBe(user.id);
          expect(user.hasNewNotifications).toBe(true);
        });
      });
      describe('should return status 400 if', () => {
        it('notificationtoken.data.userId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('ROLE_CHANGE', {
            role: 'admin',
            userId: '100',
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(INVALID_UUID('user'));
          expect(status).toBe(400);
        });
        it('role is not \'admin\' || \'superAdmin\' || \'user\'', async () => {
          const { user } = await createUser({});
          const { token: notificationtoken } = signNotificationToken('ROLE_CHANGE', {
            role: 'wrongRole',
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe('invalide role');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          const { token: notificationtoken } = signNotificationToken('ROLE_CHANGE', {
            role: 'admin',
            userId: uuidv4(),
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
