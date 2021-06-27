import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Like,
  Notification,
  NotificationFrameLiked,
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
        let frameId: string;
        let likeId: string;
        let notificationtoken: string;
        let user: User;
        let userTwo: User;

        beforeEach(async (done) => {
          try {
            const { user: createdUser } = await createUser({});
            user = createdUser;
            const { user: newUser } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            userTwo = newUser;
            const galerie = await createGalerie({
              userId: user.id,
            });
            galerieId = galerie.id;
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
          const notificationsFrameLiked = await NotificationFrameLiked.findAll();
          await user.reload();
          expect(notifications.length).toBe(1);
          expect(notifications[0].frameId).toBe(frameId);
          expect(notifications[0].galerieId).toBeNull();
          expect(notifications[0].num).toBe(1);
          expect(notifications[0].seen).toBe(false);
          expect(notifications[0].type).toBe('FRAME_LIKED');
          expect(notifications[0].userId).toBe(user.id);
          expect(notificationsFrameLiked.length).toBe(1);
          expect(notificationsFrameLiked[0].notificationId).toBe(notifications[0].id);
          expect(notificationsFrameLiked[0].userId).toBe(userTwo.id);
          expect(user.hasNewNotifications).toBe(true);
        });
        it('create a notification if another notification exist && seen === true && was create there is more than 4 days', async () => {
          const num = 1;
          const timeStamp = 1434319925275;
          mockDate.set(timeStamp);
          const notification = await createNotification({
            frameId,
            num,
            seen: true,
            type: 'FRAME_LIKED',
            userId: user.id,
          });
          mockDate.set(timeStamp + 1000 * 60 * 60 * 24 * 4 + 1);
          await postNotifications(app, {
            notificationtoken,
          });
          await notification.reload();
          const notifications = await Notification.findAll();
          expect(notification.num).toBe(num);
          expect(notification.seen).toBe(true);
          expect(notifications.length).toBe(2);
        });
        it('increment notification.num if a notification for this frame liked already exist && seen === false', async () => {
          const num = 1;
          const notification = await createNotification({
            frameId,
            num,
            type: 'FRAME_LIKED',
            userId: user.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notificationsFrameLiked = await NotificationFrameLiked.findAll();
          await notification.reload();
          await user.reload();
          expect(notification.num).toBe(num + 1);
          expect(notifications.length).toBe(1);
          expect(notificationsFrameLiked.length).toBe(1);
          expect(notificationsFrameLiked[0].notificationId).toBe(notification.id);
          expect(notificationsFrameLiked[0].userId).toBe(userTwo.id);
          expect(user.hasNewNotifications).toBe(true);
        });
        it('increment notification.num if another notification exist && seen === true && was create less than 4 days ago', async () => {
          const num = 1;
          const notification = await createNotification({
            frameId,
            num,
            seen: true,
            type: 'FRAME_LIKED',
            userId: user.id,
          });
          await postNotifications(app, {
            notificationtoken,
          });
          const notifications = await Notification.findAll();
          const notificationsFrameLiked = await NotificationFrameLiked.findAll();
          await notification.reload();
          await user.reload();
          expect(notification.num).toBe(num + 1);
          expect(notification.seen).toBe(false);
          expect(notifications.length).toBe(1);
          expect(notificationsFrameLiked.length).toBe(1);
          expect(notificationsFrameLiked[0].notificationId).toBe(notification.id);
          expect(notificationsFrameLiked[0].userId).toBe(userTwo.id);
          expect(user.hasNewNotifications).toBe(true);
        });
        it('do not create notification if allowNotification === false', async () => {
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          await createGalerieUser({
            galerieId,
            allowNotification: false,
            userId: userThree.id,
          });
          const frameTwo = await createFrame({
            galerieId,
            userId: userThree.id,
          });
          const like = await createLike({
            frameId: frameTwo.id,
            userId: userTwo.id,
          });
          const signToken = signNotificationToken('FRAME_LIKED', {
            likeId: like.id,
          });
          const { status } = await postNotifications(app, {
            notificationtoken: signToken.token,
          });
          await like.reload();
          const notifications = await Notification.findAll();
          await user.reload();
          expect(like.notificationHasBeenSend).toBe(true);
          expect(notifications.length).toBe(0);
          expect(status).toBe(204);
          expect(user.hasNewNotifications).toBe(false);
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
          await user.reload();
          expect(body.errors).toBe(NOTIFICATION_ALREADY_SEND('like'));
          expect(status).toBe(400);
          expect(user.hasNewNotifications).toBe(false);
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
