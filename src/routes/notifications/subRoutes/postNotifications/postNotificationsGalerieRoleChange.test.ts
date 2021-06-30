import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  Notification,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signNotificationToken } from '#src/helpers/issueJWT';
import {
  createGalerie,
  createUser,
  postNotifications,
} from '#src/helpers/test';

import initApp from '#src/server';

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

    describe('where notificationtoken.type === \'GALERIE_ROLE_CHANGE\'', () => {
      describe('should return status 200 and', () => {
        it('do not create notification if user\'s role for this galerie !== notificationtoken.data.role', async () => {
          const { user } = await createUser({});
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId,
            role: 'moderator',
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
        it('create a notification with the new role of the user for this galerie', async () => {
          const role = 'admin';
          const { user } = await createUser({});
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId,
            role,
            userId: user.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await user.reload();
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(1);
          expect(notifications[0].galerieId).toBe(galerieId);
          expect(notifications[0].role).toBe(role);
          expect(notifications[0].seen).toBe(false);
          expect(notifications[0].type).toBe('GALERIE_ROLE_CHANGE');
          expect(notifications[0].userId).toBe(user.id);
          expect(user.hasNewNotifications).toBe(true);
        });
      });
      describe('should return status 400 if', () => {
        it('notificationtokn.data.userId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId: '100',
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
        it('notificationtokn.data.galerieId is not a UUIDv4', async () => {
          const { user } = await createUser({});
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId: '100',
            role: 'admin',
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
        it('notification.data.role is not \'admin\' || \'moderator\'', async () => {
          const { user } = await createUser({});
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId,
            role: 'user',
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
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId: uuidv4(),
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
        it('galerie not found', async () => {
          const { user } = await createUser({});
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId: uuidv4(),
            role: 'admin',
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
        it('galerie exist but user is not subscribe to it', async () => {
          const { user } = await createUser({});
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          const { token: notificationtoken } = signNotificationToken('GALERIE_ROLE_CHANGE', {
            galerieId,
            role: 'admin',
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
