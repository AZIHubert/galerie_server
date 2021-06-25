import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GalerieBlackList,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  Like,
  Notification,
  NotificationFramePosted,
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  INVALID_UUID,
  MODEL_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createFrame,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createInvitation,
  createLike,
  createNotification,
  createNotificationFramePosted,
  createUser,
  deleteGaleriesId,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/gc', () => ({
  __esModule: true,
  default: ({
    bucket: () => ({
      file: () => ({
        delete: () => Promise.resolve(),
      }),
    }),
  }),
}));

let app: Server;
let password: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('DELETE', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        jest.clearAllMocks();
        try {
          await sequelize.sync({ force: true });
          const {
            password: createdPassword,
            user: createdUser,
          } = await createUser({});

          password = createdPassword;
          user = createdUser;

          const jwt = signAuthToken(user);
          token = jwt.token;
        } catch (err) {
          done(err);
        }
        done();
      });

      afterAll(async (done) => {
        jest.clearAllMocks();
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
        const name = 'galerie\'s name';
        let galerieId: string;

        beforeEach(async (done) => {
          try {
            const galerie = await createGalerie({
              userId: user.id,
              name,
            });
            galerieId = galerie.id;
          } catch (err) {
            done(err);
          }
          done();
        });

        it('destroy galerie if user is the creator of this galerie', async () => {
          const {
            body: {
              action,
              data,
            },
            status,
          } = await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const galerie = await Galerie.findByPk(galerieId);
          expect(action).toBe('DELETE');
          expect(data).toEqual({
            galerieId,
          });
          expect(galerie).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy galerie if currentUser is not the creator of this galerie but currentUser.role === \'admin\' | \'superAdmin\'', async () => {
          const { user: admin } = await createUser({
            email: 'admin@email.com',
            role: 'admin',
            userName: 'admin',
          });
          await createGalerieUser({
            galerieId,
            userId: admin.id,
          });
          const { token: tokenTwo } = signAuthToken(admin);
          const {
            status,
          } = await deleteGaleriesId(app, tokenTwo, galerieId, {
            body: {
              name,
              password,
            },
          });
          const galerie = await Galerie.findByPk(galerieId);
          expect(galerie).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy galerie if currentUser is not subscribe to this galerie but currentUser.role === \'admin\' | \'superAdmin\'', async () => {
          const { user: admin } = await createUser({
            email: 'admin@email.com',
            role: 'admin',
            userName: 'admin',
          });
          const { token: tokenTwo } = signAuthToken(admin);
          const {
            status,
          } = await deleteGaleriesId(app, tokenTwo, galerieId, {
            body: {
              name,
              password,
            },
          });
          const galerie = await Galerie.findByPk(galerieId);
          expect(galerie).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy frames/galeriePictures/images', async () => {
          const createdFrame = await createFrame({
            galerieId,
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const frame = await Frame.findByPk(createdFrame.id);
          const galeriePictures = await GaleriePicture.findAll({
            where: {
              id: createdFrame.galeriePictures.map((gp) => gp.id),
            },
          });
          const images = await Image.findAll({
            where: {
              id: createdFrame.galeriePictures.map((gp) => gp.originalImageId),
            },
          });
          expect(frame).toBeNull();
          expect(galeriePictures.length).toBe(0);
          expect(images.length).toBe(0);
        });
        it('destroy galerieBlackList', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieBlackListId } = await createGalerieBlackList({
            galerieId,
            userId: userTwo.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const galerieBlackList = await GalerieBlackList.findByPk(galerieBlackListId);
          expect(galerieBlackList).toBeNull();
        });
        it('destroy GalerieUsers', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieUserId } = await createGalerieUser({
            galerieId,
            userId: userTwo.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const galerieUser = await GalerieUser.findByPk(galerieUserId);
          expect(galerieUser).toBeNull();
        });
        it('destroy invitations', async () => {
          const { id: invitationId } = await createInvitation({
            galerieId,
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const invitation = await Invitation.findByPk(invitationId);
          expect(invitation).toBeNull();
        });
        it('destroy likes', async () => {
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          const { id: likeId } = await createLike({
            frameId,
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const like = await Like.findByPk(likeId);
          expect(like).toBeNull();
        });
        it('destroy all notification where notification.type === \'FRAME_LIKED\' where notification.frameId was posted on this galerie', async () => {
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          const { id: notificationId } = await createNotification({
            frameId,
            type: 'FRAME_LIKED',
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const notification = await Notification.findByPk(notificationId);
          expect(notification).toBeNull();
        });
        it('destroy all NotificationFramePosted where frameId belong to this galerie', async () => {
          const { id: frameId } = await createFrame({
            galerieId,
            userId: user.id,
          });
          await createNotificationFramePosted({
            frameId,
            galerieId,
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const notificationFramePosted = await NotificationFramePosted.findAll();
          expect(notificationFramePosted.length).toBe(0);
        });
        it('destroy all notification where notification.type === \'FRAME_POSTED\' where notification.galeriId === galerie.id', async () => {
          const { id: notificationId } = await createNotification({
            galerieId,
            type: 'FRAME_POSTED',
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const notification = await Notification.findByPk(notificationId);
          expect(notification).toBeNull();
        });
        it('destoy all notification where notification.type ===\'USER_SUBSCRIBE\' and notification.galerieId === galerie.id', async () => {
          const { id: notificationId } = await createNotification({
            galerieId,
            type: 'USER_SUBSCRIBE',
            userId: user.id,
          });
          await deleteGaleriesId(app, token, galerieId, {
            body: {
              name,
              password,
            },
          });
          const notification = await Notification.findByPk(notificationId);
          expect(notification).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.galerieId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
        it('currentUser\'s role for this galerie is \'user\' and currentUser.role === \'user\'', async () => {
          const name = 'galerie\'s name';
          const galerie = await createGalerie({
            userId: user.id,
            name,
            role: 'user',
          });
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, galerie.id, {
            body: {
              name,
              password,
            },
          });
          expect(body.errors).toBe('not allow to delete this galerie');
          expect(status).toBe(400);
        });
        it('currentUser\'s role for this galerie is \'admin\' and currentUser.role === \'user\'', async () => {
          const name = 'galerie\'s name';
          const galerie = await createGalerie({
            userId: user.id,
            name,
            role: 'admin',
          });
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, galerie.id, {
            body: {
              name,
              password,
            },
          });
          expect(body.errors).toBe('not allow to delete this galerie');
          expect(status).toBe(400);
        });
        describe('name', () => {
          const name = 'galerie\'s name';
          let galerieId: string;

          beforeEach(async (done) => {
            try {
              const galerie = await createGalerie({
                userId: user.id,
                name,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });
          it('is not send', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: { password },
            });
            expect(body.errors).toEqual({
              name: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: {
                name: 1234,
                password,
              },
            });
            expect(body.errors).toEqual({
              name: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: {
                name: '',
                password,
              },
            });
            expect(body.errors).toEqual({
              name: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not match galerie\'s name', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: {
                name: `wrong${name}`,
                password,
              },
            });
            expect(body.errors).toEqual({
              name: 'wrong galerie\'s name',
            });
            expect(status).toBe(400);
          });
        });
        describe('password', () => {
          const name = 'galerie\'s name';
          let galerieId: string;

          beforeEach(async (done) => {
            try {
              const galerie = await createGalerie({
                name,
                userId: user.id,
              });
              galerieId = galerie.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('is not send', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: { name },
            });
            expect(body.errors).toEqual({
              password: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: {
                name,
                password: 1234,
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: {
                name,
                password: '',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not match user\'s password', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              body: {
                name,
                password: 'wrongPassword',
              },
            });
            expect(body.errors).toEqual({
              password: WRONG_PASSWORD,
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return error 404 if', () => {
        it('galerie doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
        it('currentUser is not subscribe to it', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: galerieId } = await createGalerie({
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, galerieId);
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
