import fs from 'fs';
import { Server } from 'http';
import { sign } from 'jsonwebtoken';
import mockDate from 'mockdate';
import path from 'path';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
// import { signNotificationToken } from '@src/helpers/issueJWT';
import {
  postNotifications,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

const PRIV_KEY = fs.readFileSync(path.join('./id_rsa_priv.notificationToken.pem'));

describe('/notification', () => {
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

    describe('should return status 401 if', () => {
      describe('request.headers.notitifcationHeaders', () => {
        it('is not set', async () => {
          const {
            body,
            status,
          } = await postNotifications(app);
          expect(body.errors).toBe(TOKEN_NOT_FOUND);
          expect(status).toBe(401);
        });
        it('is not \'Bearer ...\'', async () => {
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken: 'token',
          });
          expect(body.errors).toBe(WRONG_TOKEN);
          expect(status).toBe(401);
        });
        it('fail to be verified', async () => {
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken: 'Bearer token',
          });
          expect(body.errors).toEqual({
            name: 'JsonWebTokenError',
            message: 'jwt malformed',
          });
          expect(status).toBe(500);
        });
      });
      describe('verifyToken', () => {
        it('is not an object', async () => {
          const signedToken = sign(
            'string',
            PRIV_KEY,
            {
              algorithm: 'RS256',
            },
          );
          const {
            body,
            status,
          } = await postNotifications(app, {
            notificationtoken: `Bearer ${signedToken}`,
          });
          expect(body.errors).toBe(WRONG_TOKEN);
          expect(status).toBe(401);
        });
        describe('.data', () => {
          it('=== undefined', async () => {
            const signedToken = sign(
              {
                type: 'type',
              },
              PRIV_KEY,
              {
                algorithm: 'RS256',
              },
            );
            const {
              body,
              status,
            } = await postNotifications(app, {
              notificationtoken: `Bearer ${signedToken}`,
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
          it('is not an object', async () => {
            const signedToken = sign(
              {
                data: 1234,
                type: 'type',
              },
              PRIV_KEY,
              {
                algorithm: 'RS256',
              },
            );
            const {
              body,
              status,
            } = await postNotifications(app, {
              notificationtoken: `Bearer ${signedToken}`,
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
          it('=== null', async () => {
            const signedToken = sign(
              {
                data: null,
                type: 'type',
              },
              PRIV_KEY,
              {
                algorithm: 'RS256',
              },
            );
            const {
              body,
              status,
            } = await postNotifications(app, {
              notificationtoken: `Bearer ${signedToken}`,
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
        });
        describe('.type', () => {
          it('=== undefined', async () => {
            const signedToken = sign(
              {
                data: {},
              },
              PRIV_KEY,
              {
                algorithm: 'RS256',
              },
            );
            const {
              body,
              status,
            } = await postNotifications(app, {
              notificationtoken: `Bearer ${signedToken}`,
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
          it('is not a string', async () => {
            const signedToken = sign(
              {
                data: {},
                type: 1234,
              },
              PRIV_KEY,
              {
                algorithm: 'RS256',
              },
            );
            const {
              body,
              status,
            } = await postNotifications(app, {
              notificationtoken: `Bearer ${signedToken}`,
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
          it('is !== \'FRAME_POSTED\'', async () => {
            const signedToken = sign(
              {
                data: {},
                type: 'WRONG_TYPE',
              },
              PRIV_KEY,
              {
                algorithm: 'RS256',
              },
            );
            const {
              body,
              status,
            } = await postNotifications(app, {
              notificationtoken: `Bearer ${signedToken}`,
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
        });
      });
    });
  });
});
