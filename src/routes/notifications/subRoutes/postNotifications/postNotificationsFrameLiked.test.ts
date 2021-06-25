import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Like,
  Notification,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signNotificationToken } from '@src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createNotification,
  createUser,
  postNotifications,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/Notifications', () => {
  describe('POST', () => {
    describe('notificationToken.type === \'FRAME_LIKED\'', () => {
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
        let frameId: string;
        let likeId: string;
        let notificationtoken: string;
        let userId: string;

        beforeEach(async (done) => {
          try {
            const { user } = await createUser({});
            userId = user.id;
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { id: galerieId } = await createGalerie({
              userId: user.id,
            });
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            const frame = await createFrame({
              galerieId,
              userId: user.id,
            });
            frameId = frame.id;
            const like = await createLike({
              frameId,
              userId: userTwo.id,
            });
            likeId = like.id;
            const signToken = signNotificationToken('FRAME_LIKED', {
              likeId,
            });
            notificationtoken = signToken.token;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('set like.notificationHasBeenSend === true', async () => {
          const { status } = await postNotifications(app, {
            notificationtoken,
          });
          const like = await Like.findByPk(likeId) as Like;
          expect(like.notificationHasBeenSend).toBe(true);
          expect(status).toBe(204);
        });
        it('create a notification if no other notification for this frame liked already exist', async () => {
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(1);
          expect(notifications[0].frameId).toBe(frameId);
          expect(notifications[0].galerieId).toBeNull();
          expect(notifications[0].num).toBe(1);
          expect(notifications[0].type).toBe('FRAME_LIKED');
          expect(notifications[0].userId).toBe(userId);
        });
        it('increment notification.num if a notification for this frame liked already exist', async () => {
          const num = 1;
          const notification = await createNotification({
            frameId,
            num,
            type: 'FRAME_LIKED',
            userId,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          await notification.reload();
          expect(notifications.length).toBe(1);
          expect(notification.num).toBe(num + 1);
        });
      });
      describe('should return status 400 if', () => {
        it('notificationToken.data.likedId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('FRAME_LIKED', {
            likeId: '100',
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(INVALID_UUID('like'));
          expect(status).toBe(400);
        });
        it('like.notificationHasBeenSend === true', async () => {
          const { user } = await createUser({});
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          await createGalerieUser({
            galerieId,
            userId: userTwo.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          const { id: likeId } = await createLike({
            frameId,
            notificationHasBeenSend: true,
            userId: userTwo.id,
          });
          const { token: notificationtoken } = signNotificationToken('FRAME_LIKED', {
            likeId,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe('notifications already send for this like');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('like not found', async () => {
          const { token: notificationtoken } = signNotificationToken('FRAME_LIKED', {
            likeId: uuidv4(),
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('like'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
