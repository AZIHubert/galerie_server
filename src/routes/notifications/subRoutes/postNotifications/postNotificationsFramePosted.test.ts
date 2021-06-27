import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  Notification,
  NotificationFramePosted,
  User,
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
  createNotification,
  createUser,
  postNotifications,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/Notifications', () => {
  describe('POST', () => {
    describe('notificationToken.type === \'FRAME_POSTED\'', () => {
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

      describe('should return status 204 and', () => {
        let frameId: string;
        let galerieId: string;
        let notificationtoken: string;
        let user: User;

        beforeEach(async (done) => {
          try {
            const { user: createdUser } = await createUser({});
            user = createdUser;
            const galerie = await createGalerie({
              userId: user.id,
            });
            galerieId = galerie.id;
            const frame = await createFrame({
              galerieId,
              userId: user.id,
            });
            frameId = frame.id;
            const signToken = signNotificationToken('FRAME_POSTED', {
              frameId,
            });
            notificationtoken = signToken.token;
          } catch (err) {
            done(err);
          }
          done();
        });
        it('create no notification if the user who post the frame was the only one subscribe to the galerie', async () => {
          const {
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(0);
          expect(status).toBe(204);
        });
        it('create notifications if a notification for a frame posted to the galerie do not exist', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createGalerieUser({
            galerieId,
            userId: userTwo.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notificationsFramePosted = await NotificationFramePosted.findAll();
          expect(notifications.length).toBe(1);
          expect(notifications[0].galerieId).toBe(galerieId);
          expect(notifications[0].num).toBe(1);
          expect(notifications[0].seen).toBe(false);
          expect(notifications[0].type).toBe('FRAME_POSTED');
          expect(notifications[0].userId).toBe(userTwo.id);
          expect(notificationsFramePosted.length).toBe(1);
          expect(notificationsFramePosted[0].frameId).toBe(frameId);
          expect(notificationsFramePosted[0].notificationId).toBe(notifications[0].id);
        });
        it('increment notification.num if a notification for frame posted to the galerie already exist', async () => {
          const num = 1;
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await createGalerieUser({
            galerieId,
            userId: userTwo.id,
          });
          const notification = await createNotification({
            galerieId,
            num,
            type: 'FRAME_POSTED',
            userId: userTwo.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await notification.reload();
          const notificationsFramePosted = await NotificationFramePosted.findAll();
          expect(notification.num).toBe(num + 1);
          expect(notificationsFramePosted.length).toBe(1);
          expect(notificationsFramePosted[0].frameId).toBe(frameId);
          expect(notificationsFramePosted[0].notificationId).toBe(notification.id);
        });
        it('set frame.notificationHasBeenSend === true', async () => {
          await postNotifications(app, {
            notificationtoken,
          });
          const frame = await Frame.findByPk(frameId) as Frame;
          expect(frame.notificationHasBeenSend).toBe(true);
        });
        it('do not create notification for user not subscribe to the galerie', async () => {
          await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(0);
        });
        it('do not increment notification where notification.galerieId !== frame.galerieId', async () => {
          const num = 1;
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const galerieTwo = await createGalerie({
            userId: userTwo.id,
          });
          const notification = await createNotification({
            galerieId: galerieTwo.id,
            num,
            type: 'FRAME_POSTED',
            userId: userTwo.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await notification.reload();
          expect(notification.num).toBe(num);
        });
        it('do not create notification if allowNotification === false', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const galerie = await createGalerie({
            userId: user.id,
            allowNotification: false,
          });
          await createGalerieUser({
            galerieId: galerie.id,
            userId: userTwo.id,
          });
          const frame = await createFrame({
            galerieId: galerie.id,
            userId: userTwo.id,
          });
          const signToken = signNotificationToken('FRAME_POSTED', {
            frameId: frame.id,
          });
          const { status } = await postNotifications(app, {
            notificationtoken: signToken.token,
          });
          const returnedFrame = await Frame.findByPk(frame.id) as Frame;
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(0);
          expect(returnedFrame.notificationHasBeenSend).toBe(true);
          expect(status).toBe(204);
        });
      });
      describe('should return status 400 if', () => {
        it('notificatioToken.data.frameId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('FRAME_POSTED', {
            frameId: '100',
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(INVALID_UUID('frame'));
          expect(status).toBe(400);
        });
        it('frame.notificationHasBeenSend === true', async () => {
          const { user } = await createUser({});
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { id: frameId } = await createFrame({
            galerieId,
            notificationHasBeenSend: true,
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('FRAME_POSTED', {
            frameId,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe('notifications already send for this frame');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('frame not found', async () => {
          const { token: notificationtoken } = signNotificationToken('FRAME_POSTED', {
            frameId: uuidv4(),
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
