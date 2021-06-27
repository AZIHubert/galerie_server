import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createUser,
  createGalerie,
  putGaleriesIdAllowNotification,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/allowNotification', () => {
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
            } = await createUser({});
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
          it('set galerieUser.allowNotification to false', async () => {
            const galerie = await createGalerie({
              userId: user.id,
            });
            const {
              body: {
                action,
                data: {
                  allowNotification,
                  galerieId,
                },
              },
              status,
            } = await putGaleriesIdAllowNotification(app, token, galerie.id);
            expect(action).toBe('PUT');
            expect(allowNotification).toBe(false);
            expect(galerieId).toBe(galerie.id);
            expect(status).toBe(200);
          });
          it('set galerieUser.allowNotification to true', async () => {
            const galerie = await createGalerie({
              allowNotification: false,
              userId: user.id,
            });
            const {
              body: {
                data: {
                  allowNotification,
                },
              },
            } = await putGaleriesIdAllowNotification(app, token, galerie.id);
            expect(allowNotification).toBe(true);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await putGaleriesIdAllowNotification(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('galerie not found', async () => {
            const {
              body,
              status,
            } = await putGaleriesIdAllowNotification(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('galerie exist but user is not subscribe to it', async () => {
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
            } = await putGaleriesIdAllowNotification(app, token, galerieId);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
