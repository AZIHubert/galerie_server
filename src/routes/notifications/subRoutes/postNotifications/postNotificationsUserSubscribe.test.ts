import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  GalerieUser,
  Notification,
  NotificationUserSubscribe,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  NOTIFICATION_ALREADY_SEND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signNotificationToken } from '#src/helpers/issueJWT';
import {
  createGalerie,
  createGalerieUser,
  createNotificationUserSubscribe,
  createUser,
  postNotifications,
} from '#src/helpers/test';

import initApp from '#src/server';

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
        let admin: User;

        beforeEach(async (done) => {
          try {
            const { user: userOne } = await createUser({});
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            subscribedUserId = userTwo.id;
            admin = userOne;
            const galerie = await createGalerie({
              userId: admin.id,
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
            userId: admin.id,
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
        it('create only one notification if the admin of the galerie is also the creator of the invitation', async () => {
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: admin.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await admin.reload();
          const notifications = await Notification.findAll();
          const notificationsUserSubscribe = await NotificationUserSubscribe.findAll();
          expect(notifications.length).toBe(1);
          expect(notificationsUserSubscribe.length).toBe(1);
          expect(admin.hasNewNotifications).toBe(true);
        });
        it('increment notification.num for the admin of the galerie && the creator of the invitation if they both already have a notification', async () => {
          const num = 1;
          const { user: moderator } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'moderator',
            userId: moderator.id,
          });
          const { id: moderatorNotificationId } = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: moderator.id,
          });
          const { id: adminNotificationId } = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: admin.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: moderator.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          await admin.reload();
          const adminNotifications = await Notification.findAll({
            where: {
              userId: admin.id,
            },
          });
          await moderator.reload();
          const moderatorNotifications = await Notification.findAll({
            where: {
              userId: admin.id,
            },
          });
          const oldAdminNotification = await Notification.findByPk(adminNotificationId);
          const oldModeratorNotification = await Notification.findByPk(moderatorNotificationId);
          expect(admin.hasNewNotifications).toBe(true);
          expect(adminNotifications.length).toBe(1);
          expect(adminNotifications[0].num).toBe(num + 1);
          expect(moderator.hasNewNotifications).toBe(true);
          expect(moderatorNotifications.length).toBe(1);
          expect(moderatorNotifications[0].num).toBe(num + 1);
          expect(oldModeratorNotification).toBeNull();
          expect(oldAdminNotification).toBeNull();
        });
        it('increment notification.num for the admin of the galerie if he already have a notification and create a notification for the creator of the invitation if he do not have a notification yet', async () => {
          const num = 1;
          const { user: moderator } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'moderator',
            userId: moderator.id,
          });
          const { id: adminNotificationId } = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: admin.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: moderator.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const moderatorNotification = await Notification.findOne({
            where: {
              galerieId,
              userId: moderator.id,
            },
          });
          const adminNotification = await Notification.findAll({
            where: {
              userId: admin.id,
            },
          });
          const oldAdminNotification = await Notification.findByPk(adminNotificationId);
          expect(moderatorNotification).not.toBeNull();
          expect(adminNotification.length).toBe(1);
          expect(adminNotification[0].num).toBe(num + 1);
          expect(oldAdminNotification).toBeNull();
        });
        it('create notification for the admin of the galerie and the creator of the invitation if the both not have a notification yet', async () => {
          const { user: moderator } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'moderator',
            userId: moderator.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: moderator.id,
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
          const { user: moderator } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            role: 'moderator',
            userId: moderator.id,
          });
          const { id: moderatorNotificationId } = await createNotificationUserSubscribe({
            galerieId,
            num,
            userId: moderator.id,
          });
          const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
            galerieId,
            subscribedUserId,
            userId: moderator.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const moderatorNotifications = await Notification.findAll({
            where: {
              userId: moderator.id,
            },
          });
          const adminNotification = await Notification.findOne({
            where: {
              galerieId,
              userId: admin.id,
            },
          });
          const oldModeratorNotification = await Notification.findByPk(moderatorNotificationId);
          expect(adminNotification).not.toBeNull();
          expect(moderatorNotifications.length).toBe(1);
          expect(moderatorNotifications[0].num).toBe(num + 1);
          expect(oldModeratorNotification).toBeNull();
        });
        describe('increment notification.num', () => {
          const num = 1;
          let oldSubscriber: User;

          beforeEach(async (done) => {
            try {
              const { user: newUser } = await createUser({
                email: 'user4@email@email.com',
                userName: 'user4',
              });
              oldSubscriber = newUser;
            } catch (err) {
              done(err);
            }
            done();
          });

          describe('for the admin of the galerie', () => {
            let notificationtoken: string;

            beforeEach(async (done) => {
              try {
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
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                num,
                subscribedUserId: oldSubscriber.id,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              const notificationUserSubscribeOne = await NotificationUserSubscribe.findOne({
                where: {
                  userId: oldSubscriber.id,
                },
              }) as NotificationUserSubscribe;
              const notificationUserSubscribeTwo = await NotificationUserSubscribe.findOne({
                where: {
                  userId: subscribedUserId,
                },
              }) as NotificationUserSubscribe;
              await admin.reload();
              const notifications = await Notification.findAll();
              const oldNotification = await Notification.findByPk(notificationId);
              expect(notificationUserSubscribeOne).not.toBeNull();
              expect(notificationUserSubscribeOne.notificationId).toBe(notifications[0].id);
              expect(notificationUserSubscribeTwo).not.toBeNull();
              expect(notificationUserSubscribeTwo.notificationId).toBe(notifications[0].id);
              expect(notifications.length).toBe(1);
              expect(notifications[0].num).toBe(num + 1);
              expect(notifications[0].userId).toBe(admin.id);
              expect(oldNotification).toBeNull();
              expect(admin.hasNewNotifications).toBe(true);
            });
            it('if he already have a notification where seen === true and was updated at least 4 days ago', async () => {
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                num,
                seen: true,
                subscribedUserId: oldSubscriber.id,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              const notificationUserSubscribeOne = await NotificationUserSubscribe.findOne({
                where: {
                  userId: oldSubscriber.id,
                },
              }) as NotificationUserSubscribe;
              const notificationUserSubscribeTwo = await NotificationUserSubscribe.findOne({
                where: {
                  userId: subscribedUserId,
                },
              }) as NotificationUserSubscribe;
              await admin.reload();
              const notifications = await Notification.findAll();
              const oldNotification = await Notification.findByPk(notificationId);
              expect(notificationUserSubscribeOne).not.toBeNull();
              expect(notificationUserSubscribeOne.notificationId).toBe(notifications[0].id);
              expect(notificationUserSubscribeTwo).not.toBeNull();
              expect(notificationUserSubscribeTwo.notificationId).toBe(notifications[0].id);
              expect(notifications.length).toBe(1);
              expect(notifications[0].num).toBe(num + 1);
              expect(notifications[0].userId).toBe(admin.id);
              expect(oldNotification).toBeNull();
              expect(admin.hasNewNotifications).toBe(true);
            });
          });
          describe('for the creator of the invitation', () => {
            let notificationtoken: string;
            let moderator: User;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                moderator = createdUser;
                await createGalerieUser({
                  galerieId,
                  role: 'admin',
                  userId: moderator.id,
                });
                const signToken = signNotificationToken('USER_SUBSCRIBE', {
                  galerieId,
                  subscribedUserId,
                  userId: moderator.id,
                });
                notificationtoken = signToken.token;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('if he already have a notification where seen === false', async () => {
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                num,
                subscribedUserId: oldSubscriber.id,
                userId: moderator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              const { id: newNotificationId } = await Notification.findOne({
                where: {
                  userId: moderator.id,
                },
              }) as Notification;
              const notificationUserSubscribeOne = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: newNotificationId,
                  userId: oldSubscriber.id,
                },
              }) as NotificationUserSubscribe;
              const notificationUserSubscribeTwo = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: newNotificationId,
                  userId: subscribedUserId,
                },
              }) as NotificationUserSubscribe;
              await moderator.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: moderator.id,
                },
              });
              const oldNotification = await Notification.findByPk(notificationId);
              expect(notificationUserSubscribeOne).not.toBeNull();
              expect(notificationUserSubscribeOne.notificationId).toBe(notifications[0].id);
              expect(notificationUserSubscribeTwo).not.toBeNull();
              expect(notificationUserSubscribeTwo.notificationId).toBe(notifications[0].id);
              expect(notifications.length).toBe(1);
              expect(notifications[0].num).toBe(num + 1);
              expect(notifications[0].userId).toBe(moderator.id);
              expect(oldNotification).toBeNull();
              expect(moderator.hasNewNotifications).toBe(true);
            });
            it('if he already have a notification where seen === true and was updated at least 4 days ago', async () => {
              const { id: notificationId } = await createNotificationUserSubscribe({
                galerieId,
                num,
                seen: true,
                subscribedUserId: oldSubscriber.id,
                userId: moderator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              const { id: newNotificationId } = await Notification.findOne({
                where: {
                  userId: moderator.id,
                },
              }) as Notification;
              const notificationUserSubscribeOne = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: newNotificationId,
                  userId: oldSubscriber.id,
                },
              }) as NotificationUserSubscribe;
              const notificationUserSubscribeTwo = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: newNotificationId,
                  userId: subscribedUserId,
                },
              }) as NotificationUserSubscribe;
              await moderator.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: moderator.id,
                },
              });
              const oldNotification = await Notification.findByPk(notificationId);
              expect(notificationUserSubscribeOne).not.toBeNull();
              expect(notificationUserSubscribeOne.notificationId).toBe(notifications[0].id);
              expect(notificationUserSubscribeTwo).not.toBeNull();
              expect(notificationUserSubscribeTwo.notificationId).toBe(notifications[0].id);
              expect(notifications.length).toBe(1);
              expect(notifications[0].num).toBe(num + 1);
              expect(notifications[0].userId).toBe(moderator.id);
              expect(oldNotification).toBeNull();
              expect(moderator.hasNewNotifications).toBe(true);
            });
          });
        });
        describe('create a notification', () => {
          describe('for the admin of the galerie', () => {
            let notificationtoken: string;

            beforeEach(() => {
              const signToken = signNotificationToken('USER_SUBSCRIBE', {
                galerieId,
                subscribedUserId,
                userId: admin.id,
              });
              notificationtoken = signToken.token;
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
              }) as NotificationUserSubscribe;
              expect(admin.hasNewNotifications).toBe(true);
              expect(notification.galerieId).toBe(galerieId);
              expect(notification.num).toBe(1);
              expect(notification.seen).toBe(false);
              expect(notification.type).toBe('USER_SUBSCRIBE');
              expect(notification.userId).toBe(admin.id);
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
                userId: admin.id,
              });
              mockDate.set(timeStamp + 1000 * 60 * 60 * 24 * 4 + 1);
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
              expect(notification).not.toBeNull();
            });
          });
          describe('for the creator of the invitation', () => {
            let moderator: User;
            let notificationtoken: string;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                moderator = createdUser;
                await createGalerieUser({
                  galerieId,
                  role: 'moderator',
                  userId: moderator.id,
                });
                const signToken = signNotificationToken('USER_SUBSCRIBE', {
                  galerieId,
                  subscribedUserId,
                  userId: moderator.id,
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
              await moderator.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: moderator.id,
                },
              }) as Notification;
              const notificationUserSubscribe = await NotificationUserSubscribe.findOne({
                where: {
                  notificationId: notification.id,
                },
              });
              expect(moderator.hasNewNotifications).toBe(true);
              expect(notification.galerieId).toBe(galerieId);
              expect(notification.num).toBe(1);
              expect(notification.seen).toBe(false);
              expect(notification.type).toBe('USER_SUBSCRIBE');
              expect(notification.userId).toBe(moderator.id);
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
                userId: moderator.id,
              });
              mockDate.set(timeStamp + 1000 * 60 * 60 * 24 * 4 + 1);
              await postNotifications(app, {
                notificationtoken,
              });
              await notification.reload();
              const notifications = await Notification.findAll({
                where: {
                  userId: moderator.id,
                },
              });
              expect(notification.num).toBe(num);
              expect(notification.seen).toBe(true);
              expect(notifications.length).toBe(2);
            });
            it('if he have a notification for an another galerie', async () => {
              const galerieTwo = await createGalerie({
                name: 'galerie2',
                userId: moderator.id,
              });
              await createNotificationUserSubscribe({
                galerieId: galerieTwo.id,
                userId: moderator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await moderator.reload();
              const notification = await Notification.findOne({
                where: {
                  galerieId,
                  userId: moderator.id,
                },
              });
              expect(moderator.hasNewNotifications).toBe(true);
              expect(notification).not.toBeUndefined();
            });
          });
        });
        describe('do not create a notification', () => {
          describe('for the admin of the galerie', () => {
            it('if allowNotification === false', async () => {
              const galerieTwo = await createGalerie({
                allowNotification: false,
                name: 'galerie2',
                userId: admin.id,
              });
              await createGalerieUser({
                galerieId: galerieTwo.id,
                userId: subscribedUserId,
              });
              const { token: notificationtoken } = signNotificationToken('USER_SUBSCRIBE', {
                galerieId: galerieTwo.id,
                subscribedUserId,
                userId: admin.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              const notification = await Notification.findOne({
                where: {
                  userId: admin.id,
                },
              });
              await admin.reload();
              expect(notification).toBeNull();
              expect(admin.hasNewNotifications).toBe(false);
            });
          });
          describe('for the creator of the invitation', () => {
            let moderator: User;
            let notificationtoken: string;

            beforeEach(async (done) => {
              try {
                const { user } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                moderator = user;
              } catch (err) {
                done(err);
              }
              const signToken = signNotificationToken('USER_SUBSCRIBE', {
                galerieId,
                subscribedUserId,
                userId: moderator.id,
              });
              notificationtoken = signToken.token;
              done();
            });

            it('if his role for the galerie is \'user\'', async () => {
              await createGalerieUser({
                galerieId,
                userId: moderator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await moderator.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: moderator.id,
                },
              });
              expect(moderator.hasNewNotifications).toBe(false);
              expect(notification).toBeNull();
            });
            it('if he is not subscribe to the galerie', async () => {
              await postNotifications(app, {
                notificationtoken,
              });
              await moderator.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: moderator.id,
                },
              });
              expect(moderator.hasNewNotifications).toBe(false);
              expect(notification).toBeNull();
            });
            it('if allowNotification === false', async () => {
              await createGalerieUser({
                allowNotification: false,
                galerieId,
                role: 'moderator',
                userId: moderator.id,
              });
              await postNotifications(app, {
                notificationtoken,
              });
              await moderator.reload();
              const notification = await Notification.findOne({
                where: {
                  userId: moderator.id,
                },
              });
              expect(notification).toBeNull();
              expect(moderator.hasNewNotifications).toBe(false);
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
