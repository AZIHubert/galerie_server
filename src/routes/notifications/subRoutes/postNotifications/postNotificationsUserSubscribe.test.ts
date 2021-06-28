import { Server } from 'http';
import mockDate from 'mockdate';
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
  createNotificationUserSubscribe,
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
        let galerieId: string;
        let subscribedUserId: string;
        let creator: User;

        beforeEach(async (done) => {
          try {
            const { user: userOne } = await createUser({});
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            subscribedUserId = userTwo.id;
            creator = userOne;
            const galerie = await createGalerie({
              userId: creator.id,
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
            userId: creator.id,
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
        it('create only one notification if the creator of the galerie is also the creator of the invitation', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: creator.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await creator.reload();
          const notifications = await Notification.findAll();
          const notificationsUserSubscribe = await NotificationUserSubscribe.findAll();
          expect(notifications.length).toBe(1);
          expect(notificationsUserSubscribe.length).toBe(1);
          expect(creator.hasNewNotifications).toBe(true);
        });
        it('increment notification.num for the creator of the galerie && the creator of the invitation if they both already have a notification', async () => {
          const num = 1;
          const { user: admin } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: admin.id,
          });
          const adminNotification = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: admin.id,
          });
          const creatorNotification = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: creator.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: admin.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await admin.reload();
          await adminNotification.reload();
          await creator.reload();
          await creatorNotification.reload();
          expect(admin.hasNewNotifications).toBe(true);
          expect(adminNotification.num).toBe(num + 1);
          expect(creator.hasNewNotifications).toBe(true);
          expect(creatorNotification.num).toBe(num + 1);
        });
        it('increment notification.num for the creator of the galerie if he already have a notification and create a notification for the creator of the invitation if he do not have a notification yet', async () => {
          const num = 1;
          const { user: admin } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: admin.id,
          });
          const creatorNotification = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: creator.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: admin.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const adminNotification = await Notification.findOne({
            where: {
              galerieId,
              userId: admin.id,
            },
          });
          await creatorNotification.reload();
          expect(adminNotification).not.toBeNull();
          expect(creatorNotification.num).toBe(num + 1);
        });
        it('create notification for the creator of the galerie and the creator of the invitation if the both not have a notification yet', async () => {
          const { user: admin } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: admin.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: admin.id,
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
        it('create a notification for the creator of the galerie if he do not have a notification yet and increment notification.num for the creator of the invitation if he already have a notification', async () => {
          const num = 1;
          const { user: admin } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'admin',
            userId: admin.id,
          });
          const adminNotification = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: admin.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: admin.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await adminNotification.reload();
          const creatorNotification = await Notification.findOne({
            where: {
              galerieId,
              userId: creator.id,
            },
          });
          expect(adminNotification.num).toBe(num + 1);
          expect(creatorNotification).not.toBeNull();
        });
        describe('increment notification.num', () => {
          const num = 1;

          describe('for the creator of the galerie', () => {
            let notificationtoken: string;

            beforeEach(async (done) => {
              try {
                const signToken = signNotificationToken('USER_SUBSCRIBE', {
                  galerieId,
                  subscribedUserId,
                  userId: creator.id,
                });
                notificationtoken = signToken.token;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('if he already have a notification where seen === false', async () => {
              const notification = await createNotificationUserSubscribe({
                galerieId,
                num,
                userId: creator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await creator.reload();
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: creator.id,
                },
              });
              expect(creator.hasNewNotifications).toBe(true);
              expect(notification.num).toBe(num + 1);
              expect(notifications.length).toBe(1);
            });
            it('if he already have a notification where seen === true and was updated at least 4 days ago', async () => {
              const notification = await createNotificationUserSubscribe({
                galerieId,
                num,
                seen: true,
                userId: creator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await creator.reload();
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: creator.id,
                },
              });
              expect(creator.hasNewNotifications).toBe(true);
              expect(notification.num).toBe(num + 1);
              expect(notification.seen).toBe(false);
              expect(notifications.length).toBe(1);
            });
          });
          describe('for the creator of the invitation', () => {
            let notificationtoken: string;
            let admin: User;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                admin = createdUser;
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: admin.id,
                });
                const signToken = signNotificationToken('USER_SUBSCRIBE', {
                  galerieId,
                  subscribedUserId,
                  userId: admin.id,
                });
                notificationtoken = signToken.token;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('if he already have a notification where seen === false', async () => {
              const notification = await createNotificationUserSubscribe({
                galerieId,
                num,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: admin.id,
                },
              });
              expect(admin.hasNewNotifications).toBe(true);
              expect(notification.num).toBe(num + 1);
              expect(notifications.length).toBe(1);
            });
            it('if he already have a notification where seen === true and was updated at least 4 days ago', async () => {
              const notification = await createNotificationUserSubscribe({
                galerieId,
                num,
                seen: true,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: admin.id,
                },
              });
              expect(notification.num).toBe(num + 1);
              expect(notification.seen).toBe(false);
              expect(notifications.length).toBe(1);
            });
          });
        });
        describe('create a notification', () => {
          describe('for the creator of the galerie', () => {
            let notificationtoken: string;

            beforeEach(() => {
              const signToken = signNotificationToken('USER_SUBSCRIBE', {
                galerieId,
                subscribedUserId,
                userId: creator.id,
              });
              notificationtoken = signToken.token;
            });

            it('if he do not have a notification yet', async () => {
              await postNotifications(app, {
                notificationtoken,
              });
              await creator.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: creator.id,
                },
              }) as Notification;
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: notification.id,
                },
              }) as NotificationUserSubscribe;
              expect(creator.hasNewNotifications).toBe(true);
              expect(notification.galerieId).toBe(galerieId);
              expect(notification.num).toBe(1);
              expect(notification.seen).toBe(false);
              expect(notification.type).toBe('USER_SUBSCRIBE');
              expect(notification.userId).toBe(creator.id);
              expect(notificationUserSubscribe.userId).toBe(subscribedUserId);
            });
            it('if he already have a notification where seen === true and was updated there was more than 4 days', async () => {
              const num = 1;
              const timeStamp = 1434319925275;
              mockDate.set(timeStamp);
              const notification = await createNotificationUserSubscribe({
                galerieId,
                num,
                seen: true,
                userId: creator.id,
              });
              mockDate.set(timeStamp + 1000 * 60 * 60 * 24 * 4 + 1);
              await postNotifications(app, {
                notificationtoken,
              });
              await creator.reload();
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: creator.id,
                },
              });
              expect(notification.num).toBe(num);
              expect(notification.seen).toBe(true);
              expect(notifications.length).toBe(2);
            });
            it('if he have a notification for an another galerie', async () => {
              const galerieTwo = await createGalerie({
                name: 'galerie2',
                userId: creator.id,
              });
              await createNotificationUserSubscribe({
                galerieId: galerieTwo.id,
                userId: creator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await creator.reload();
              const notification = await Notification.findOne({
                where: {
                  galerieId,
                  userId: creator.id,
                },
              });
              expect(creator.hasNewNotifications).toBe(true);
              expect(notification).not.toBeNull();
            });
          });
          describe('for the creator of the invitation', () => {
            let admin: User;
            let notificationtoken: string;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                admin = createdUser;
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: admin.id,
                });
                const signToken = signNotificationToken('USER_SUBSCRIBE', {
                  galerieId,
                  subscribedUserId,
                  userId: admin.id,
                });
                notificationtoken = signToken.token;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('if he do not have a notification yet', async () => {
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: admin.id,
                },
              }) as Notification;
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: notification.id,
                },
              });
              expect(admin.hasNewNotifications).toBe(true);
              expect(notification.galerieId).toBe(galerieId);
              expect(notification.num).toBe(1);
              expect(notification.seen).toBe(false);
              expect(notification.type).toBe('USER_SUBSCRIBE');
              expect(notification.userId).toBe(admin.id);
              expect(notificationUserSubscribe).not.toBeNull();
            });
            it('if he already have a notification where seen === true and was updated there was more than 4 days', async () => {
              const num = 1;
              const timeStamp = 1434319925275;
              mockDate.set(timeStamp);
              const notification = await createNotificationUserSubscribe({
                galerieId,
                num,
                seen: true,
                userId: admin.id,
              });
              mockDate.set(timeStamp + 1000 * 60 * 60 * 24 * 4 + 1);
              await postNotifications(app, {
                notificationtoken,
              });
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: admin.id,
                },
              });
              expect(notification.num).toBe(num);
              expect(notification.seen).toBe(true);
              expect(notifications.length).toBe(2);
            });
            it('if he have a notification for an another galerie', async () => {
              const galerieTwo = await createGalerie({
                name: 'galerie2',
                userId: admin.id,
              });
              await createNotificationUserSubscribe({
                galerieId: galerieTwo.id,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              const notification = await Notification.findOne({
                where: {
                  galerieId,
                  userId: admin.id,
                },
              });
              expect(admin.hasNewNotifications).toBe(true);
              expect(notification).not.toBeUndefined();
            });
          });
        });
        describe('do not create a notification', () => {
          describe('for the creator of the galerie', () => {
            it('if allowNotification === false', async () => {
              const galerieTwo = await createGalerie({
                allowNotification: false,
                name: 'galerie2',
                userId: creator.id,
              });
              await createGalerieUser({
                galerieId: galerieTwo.id,
                userId: subscribedUserId,
              });
              const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
                galerieId: galerieTwo.id,
                subscribedUserId,
                userId: creator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              const notification = await Notification.findOne({
                where: {
                  userId: creator.id,
                },
              });
              await creator.reload();
              expect(notification).toBeNull();
              expect(creator.hasNewNotifications).toBe(false);
            });
          });
          describe('for the creator of the invitation', () => {
            let admin: User;
            let notificationtoken: string;

            beforeEach(async (done) => {
              try {
                const { user } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                admin = user;
              } catch (err) {
                done(err);
              }
              const signToken = signNotificationToken('USER_SUBSCRIBE', {
                galerieId,
                subscribedUserId,
                userId: admin.id,
              });
              notificationtoken = signToken.token;
              done();
            });

            it('if his role for the galerie is \'user\'', async () => {
              await createGalerieUser({
                galerieId,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: admin.id,
                },
              });
              expect(admin.hasNewNotifications).toBe(false);
              expect(notification).toBeNull();
            });
            it('if he is not subscribe to the galerie', async () => {
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: admin.id,
                },
              });
              expect(admin.hasNewNotifications).toBe(false);
              expect(notification).toBeNull();
            });
            it('if allowNotification === false', async () => {
              await createGalerieUser({
                allowNotification: false,
                galerieId,
                role: 'admin',
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await admin.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: admin.id,
                },
              });
              expect(notification).toBeNull();
              expect(admin.hasNewNotifications).toBe(false);
            });
          });
        });
      });
      describe('should return status 400 if', () => {
        it('notification.data.galerieId is not a UUIDv4', async () => {
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
