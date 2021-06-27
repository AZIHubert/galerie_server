import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GalerieUser,
  Notification,
  NotificationUserSubscribe,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  NOTIFICATION_ALREADY_SEND,
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
        let subscribedUserId: string;
        let user: User;

        beforeEach(async (done) => {
          try {
            const { user: createdUser } = await createUser({});
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            subscribedUserId = userTwo.id;
            user = createdUser;
            const galerie = await createGalerie({
              userId: user.id,
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
            userId: user.id,
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
            userId: user.id,
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
          await user.reload();
          await notification.reload();
          const notifications = await Notification.findAll();
          const notificationsUserSubscribe = await NotificationUserSubscribe.findAll();
          expect(notifications.length).toBe(1);
          expect(notification.num).toBe(num + 1);
          expect(notificationsUserSubscribe.length).toBe(1);
          expect(notificationsUserSubscribe[0].notificationId).toBe(notification.id);
          expect(notificationsUserSubscribe[0].userId).toBe(subscribedUserId);
          expect(user.hasNewNotifications).toBe(true);
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
          const notificationsUserSubscribe = await NotificationUserSubscribe.findAll();
          await user.reload();
          expect(notifications.length).toBe(1);
          expect(notifications[0].galerieId).toBe(galerieId);
          expect(notifications[0].num).toBe(1);
          expect(notifications[0].seen).toBe(false);
          expect(notifications[0].type).toBe('USER_SUBSCRIBE');
          expect(notifications[0].userId).toBe(user.id);
          expect(notificationsUserSubscribe.length).toBe(1);
          expect(notificationsUserSubscribe[0].notificationId).toBe(notifications[0].id);
          expect(notificationsUserSubscribe[0].userId).toBe(subscribedUserId);
          expect(user.hasNewNotifications).toBe(true);
        });
        it('create a notification for the creator of the galerie if he have a notification for an another galerie', async () => {
          const galerieTwo = await createGalerie({
            userId: user.id,
          });
          await createNotification({
            galerieId: galerieTwo.id,
            num: 1,
            type: 'USER_SUBSCRIBE',
            userId: user.id,
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
          await user.reload();
          const notifications = await Notification.findAll();
          const notification = notifications.find((n) => n.galerieId === galerieId);
          expect(notifications.length).toBe(2);
          expect(notification).not.toBeNull();
          expect(user.hasNewNotifications).toBe(true);
        });
        it('create only one notification if the creator of the galerie is also the creator of the invitation', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: user.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await user.reload();
          const notifications = await Notification.findAll();
          const notificationsUserSubscribe = await NotificationUserSubscribe.findAll();
          expect(notifications.length).toBe(1);
          expect(notificationsUserSubscribe.length).toBe(1);
          expect(user.hasNewNotifications).toBe(true);
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
          await userThree.reload();
          const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
            where: {
              notificationId: notification.id,
              userId: subscribedUserId,
            },
          });
          expect(notification.num).toBe(num + 1);
          expect(notificationUserSubscribe).not.toBeNull();
          expect(userThree.hasNewNotifications).toBe(true);
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
          const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
            where: {
              notificationId: notification.id,
              userId: subscribedUserId,
            },
          });
          await userThree.reload();
          expect(notification).not.toBeNull();
          expect(notification.num).toBe(1);
          expect(notificationUserSubscribe).not.toBeNull();
          expect(userThree.hasNewNotifications).toBe(true);
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
          await userThree.reload();
          expect(notification).not.toBeUndefined();
          expect(notifications.length).toBe(2);
          expect(userThree.hasNewNotifications).toBe(true);
        });
        it('do not create a notification for the creator of the invitation if his role for the galerie is \'user\'', async () => {
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
          await userThree.reload();
          expect(notification).toBeUndefined();
          expect(notifications.length).toBe(1);
          expect(userThree.hasNewNotifications).toBe(false);
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
          await userThree.reload();
          expect(notification).toBeUndefined();
          expect(notifications.length).toBe(1);
          expect(userThree.hasNewNotifications).toBe(false);
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
            userId: user.id,
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
          await user.reload();
          await userThree.reload();
          expect(adminNotification.num).toBe(num + 1);
          expect(creatorNotification.num).toBe(num + 1);
          expect(user.hasNewNotifications).toBe(true);
          expect(userThree.hasNewNotifications).toBe(true);
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
            userId: user.id,
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
              userId: user.id,
            },
          });
          await adminNotification.reload();
          expect(adminNotification.num).toBe(num + 1);
          expect(creatorNotification).not.toBeNull();
        });
        it('do not set notification for the creator if allowNotification === false', async () => {
          const { user: creator } = await createUser({
            email: 'creator@email.com',
            userName: 'creator',
          });
          const { user: admin } = await createUser({
            email: 'admin@email.com',
            userName: 'admin',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const galerie = await createGalerie({
            userId: creator.id,
            allowNotification: false,
          });
          await createGalerieUser({
            galerieId: galerie.id,
            role: 'admin',
            userId: admin.id,
          });
          await createGalerieUser({
            galerieId: galerie.id,
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: galerie.id,
            subscribedUserId: userThree.id,
            userId: admin.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const adminNotification = await Notification.findOne({
            where: {
              userId: admin.id,
            },
          });
          const creatorNotification = await Notification.findOne({
            where: {
              userId: creator.id,
            },
          });
          await creator.reload();
          await admin.reload();
          expect(adminNotification).not.toBeNull();
          expect(creatorNotification).toBeNull();
          expect(creator.hasNewNotifications).toBe(false);
          expect(admin.hasNewNotifications).toBe(true);
        });
        it('do not set notification to admin if allowNotification === false', async () => {
          const { user: creator } = await createUser({
            email: 'creator@email.com',
            userName: 'creator',
          });
          const { user: admin } = await createUser({
            email: 'admin@email.com',
            userName: 'admin',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const galerie = await createGalerie({
            userId: creator.id,
          });
          await createGalerieUser({
            allowNotification: false,
            galerieId: galerie.id,
            role: 'admin',
            userId: admin.id,
          });
          await createGalerieUser({
            galerieId: galerie.id,
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: galerie.id,
            subscribedUserId: userThree.id,
            userId: admin.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const adminNotification = await Notification.findOne({
            where: {
              userId: admin.id,
            },
          });
          const creatorNotification = await Notification.findOne({
            where: {
              userId: creator.id,
            },
          });
          await admin.reload();
          await creator.reload();
          expect(adminNotification).toBeNull();
          expect(creatorNotification).not.toBeNull();
          expect(creator.hasNewNotifications).toBe(true);
          expect(admin.hasNewNotifications).toBe(false);
        });
        it('do not set notification if allowNotification === false && creator === admin', async () => {
          const { user: creator } = await createUser({
            email: 'creator@email.com',
            userName: 'creator',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const galerie = await createGalerie({
            allowNotification: false,
            userId: creator.id,
          });
          await createGalerieUser({
            galerieId: galerie.id,
            userId: userThree.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId: galerie.id,
            subscribedUserId: userThree.id,
            userId: creator.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await creator.reload();
          const creatorNotification = await Notification.findOne({
            where: {
              userId: creator.id,
            },
          });
          expect(creatorNotification).toBeNull();
          expect(creator.hasNewNotifications).toBe(false);
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
          await user.reload();
          expect(body.errors).toBe(NOTIFICATION_ALREADY_SEND('subscription'));
          expect(status).toBe(400);
          expect(user.hasNewNotifications).toBe(false);
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
