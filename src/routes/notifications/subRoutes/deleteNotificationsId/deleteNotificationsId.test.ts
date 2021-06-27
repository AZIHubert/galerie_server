import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Notification,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createNotificationRoleChange,
  createUser,
  deleteNotificationsId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/notifications', () => {
  describe('/:notificationId', () => {
    describe('PUT', () => {
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
        it('destroy notification', async () => {
          const notification = await createNotificationRoleChange({
            role: 'user',
            userId: user.id,
          });
          const {
            body: {
              action,
              data: {
                notificationId,
              },
            },
            status,
          } = await deleteNotificationsId(app, token, notification.id);
          const deletedNotification = await Notification.findByPk(notificationId);
          expect(action).toBe('DELETE');
          expect(deletedNotification).toBeNull();
          expect(notificationId).toBe(notification.id);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.notificationId is not a UUIDv4', async () => {
          const {
            body,
            status,
          } = await deleteNotificationsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('notification'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('notification not found', async () => {
          const {
            body,
            status,
          } = await deleteNotificationsId(app, token, uuidv4());
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
          } = await deleteNotificationsId(app, token, notificationId);
          expect(body.errors).toBe(MODEL_NOT_FOUND('notification'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
