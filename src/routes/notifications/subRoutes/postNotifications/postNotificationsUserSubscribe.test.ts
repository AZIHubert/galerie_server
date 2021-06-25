import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GalerieUser,
  Notification,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signNotificationToken } from '@src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieUser,
  createNotification,
  createUser,
  postNotifications,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/Notification', () => {
  describe('POST', () => {
    describe('where notificationtoken.type === \'USER_SUBSCRIBE\'', () => {
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
        let galerieId: string;
        let userId: string;
        let subscribedUserId: string;

        beforeEach(async (done) => {
          try {
            const { user } = await createUser({});
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            subscribedUserId = userTwo.id;
            userId = user.id;
            const galerie = await createGalerie({
              userId,
            });
            galerieId = galerie.id;
            await createGalerieUser({
              galerieId,
              userId: subscribedUserId,
            });
          } catch (err) {
            done(err);
          }
          done();
        });

        it('set galerieUser.notificationHasBeenSend to true', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId,
          });
          const {
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          const galerieUser = await GalerieUser.findOne({
            where: {
              galerieId,
              userId: subscribedUserId,
            },
          }) as GalerieUser;
          expect(galerieUser.notificationHasBeenSend).toBe(true);
          expect(status).toBe(204);
        });
        it('increment notification.num for notification of the creator of the galerie if the galerie have a creator and the creator still have a notification', async () => {
          const num = 1;
          const notification = await createNotification({
            galerieId,
            num,
            type: 'USER_SUBSCRIBE',
            userId,
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await notification.reload();
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(1);
          expect(notification.num).toBe(num + 1);
        });
        it('create a notification for the creator of the galerie if the galerie have a creator and the creator do not have a notification yet', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(1);
          expect(notifications[0].galerieId).toBe(galerieId);
          expect(notifications[0].num).toBe(1);
          expect(notifications[0].type).toBe('USER_SUBSCRIBE');
          expect(notifications[0].userId).toBe(userId);
        });
        it('create a notification for the creator of the galerie if he have a notification for another galerie', async () => {
          const galerieTwo = await createGalerie({
            userId,
          });
          await createNotification({
            galerieId: galerieTwo.id,
            num: 1,
            type: 'USER_SUBSCRIBE',
            userId,
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notification = notifications.find((n) => n.galerieId === galerieId);
          expect(notifications.length).toBe(2);
          expect(notification).not.toBeNull();
        });
        it('create only one notification if the creator of the galerie is also the creator of the invitation', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          expect(notifications.length).toBe(1);
        });
        it('increment notification.num for the notification of the creator of the invitation if the creator of the notification still have a notification', async () => {
          const num = 1;
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const notification = await createNotification({
            galerieId,
            num,
            type: 'USER_SUBSCRIBE',
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await notification.reload();
          expect(notification.num).toBe(num + 1);
        });
        it('create a notification if the creator of the invitation do not have a notification yet', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notification = await Notification.findOne({
            where: {
              galerieId,
              type: 'USER_SUBSCRIBE',
              userId: userThree.id,
            },
          }) as Notification;
          expect(notification).not.toBeNull();
          expect(notification.num).toBe(1);
        });
        it('create a notification for the creator of the invitation if he have a notification for another galerie', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const galerieTwo = await createGalerie({
            userId: userThree.id,
          });
          await createNotification({
            galerieId: galerieTwo.id,
            num: 1,
            type: 'USER_SUBSCRIBE',
            userId: userThree.id,
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll({
            where: {
              userId: userThree.id,
            },
          });
          const notification = notifications
            .find((n) => n.galerieId === galerieId && n.userId === userThree.id);
          expect(notification).not.toBeUndefined();
          expect(notifications.length).toBe(2);
        });
        it('do not create a notification for the creator of the invitation if is role for the galerie is \'user\'', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notification = notifications
            .find((n) => n.galerieId === galerieId && n.userId === userThree.id);
          expect(notification).toBeUndefined();
          expect(notifications.length).toBe(1);
        });
        it('do not create a notification for the creator of the invitation if he is not subscribe to the galerie', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notification = notifications
            .find((n) => n.galerieId === galerieId && n.userId === userThree.id);
          expect(notification).toBeUndefined();
          expect(notifications.length).toBe(1);
        });
        it('increment notification.num for the notification of the creator of the galerie and the creator of the invitation if the both still have notification', async () => {
          const num = 1;
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const adminNotification = await createNotification({
            galerieId,
            num,
            type: 'USER_SUBSCRIBE',
            userId: userThree.id,
          });
          const creatorNotification = await createNotification({
            galerieId,
            num,
            type: 'USER_SUBSCRIBE',
            userId,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await adminNotification.reload();
          await creatorNotification.reload();
          expect(adminNotification.num).toBe(num + 1);
          expect(creatorNotification.num).toBe(num + 1);
        });
        it('create notification for the creator of the galerie and the creator of the invitation if the both not have a notification yet', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll({
            where: {
              galerieId,
            },
          });
          expect(notifications.length).toBe(2);
        });
        it('increment notification.num for the creator of the galerie if is still have a notification and create a notification for the creator of the invitation if he not have a notification yet', async () => {
          const num = 1;
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const creatorNotification = await createNotification({
            galerieId,
            num,
            type: 'USER_SUBSCRIBE',
            userId,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const adminNotification = await Notification.findOne({
            where: {
              galerieId,
              userId: userThree.id,
            },
          });
          await creatorNotification.reload();
          expect(adminNotification).not.toBeNull();
          expect(creatorNotification.num).toBe(num + 1);
        });
        it('create a notification for the creator of the galerie if he not have a notification yet and increment notification.num for the creator of the invitation if he still have a notification', async () => {
          const num = 1;
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: userThree.id,
          });
          const adminNotification = await createNotification({
            galerieId,
            num,
            type: 'USER_SUBSCRIBE',
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: userThree.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const creatorNotification = await Notification.findOne({
            where: {
              galerieId,
              userId,
            },
          });
          await adminNotification.reload();
          expect(adminNotification.num).toBe(num + 1);
          expect(creatorNotification).not.toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('notification.data.galeriId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: '100',
            subscribedUserId: uuidv4(),
            userId: uuidv4(),
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
        it('notification.data.subscribedUserId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: uuidv4(),
            subscribedUserId: '100',
            userId: uuidv4(),
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
        it('notification.data.userId is not a UUIDv4', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: uuidv4(),
            subscribedUserId: uuidv4(),
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
        it('galerieUser.notificationHasBeenSend === true', async () => {
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
            notificationHasBeenSend: true,
            userId: userTwo.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId: userTwo.id,
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe('notifications already send for this galerieUser');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('galerieUser not found (galerieId not found)', async () => {
          const { user } = await createUser({});
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: uuidv4(),
            subscribedUserId: userTwo.id,
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerieUser'));
          expect(status).toBe(404);
        });
        it('galerieUser not found (subscribedUserId not found)', async () => {
          const { user } = await createUser({});
          const { id: galerieId } = await createGalerie({
            userId: user.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId: uuidv4(),
            userId: user.id,
          });
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerieUser'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
