import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  ALREADY_CONFIRMED,
  TOKEN_NOT_FOUND,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  putConfirmation,
} from '@src/helpers/test';
import * as verifyConfirmation from '@src/helpers/verifyConfirmation';

import initApp from '@src/server';

describe('users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let user: User;

  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({
        confirmed: false,
      });
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

  describe('confirmation', () => {
    describe('PUT', () => {
      describe('should return status 200 and', () => {
        it('return a token', async () => {
          jest.spyOn(verifyConfirmation, 'confirmUser')
            .mockImplementationOnce(() => ({
              OK: true,
              confirmTokenVersion: user.confirmTokenVersion,
              id: user.id,
            }));
          const {
            body: {
              expiresIn,
              token,
            },
            status,
          } = await putConfirmation(app, 'Bearer token');
          expect(expiresIn).toBe(1800);
          expect(status).toBe(200);
          expect(typeof token).toBe('string');
        });
        it('increment confirmTokenVersion and set confirmed to true', async () => {
          jest.spyOn(verifyConfirmation, 'confirmUser')
            .mockImplementationOnce(() => ({
              OK: true,
              confirmTokenVersion: user.confirmTokenVersion,
              id: user.id,
            }));
          await putConfirmation(app, 'Bearer token');
          const { confirmTokenVersion } = user;
          const { confirmed } = await user.reload();
          expect(confirmed).toBeTruthy();
          expect(user.confirmTokenVersion).toBe(confirmTokenVersion + 1);
        });
      });
      describe('should return status 401 if', () => {
        it('user is already confirmed', async () => {
          const {
            confirmTokenVersion,
            id,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          jest.spyOn(verifyConfirmation, 'confirmUser')
            .mockImplementationOnce(() => ({
              OK: true,
              confirmTokenVersion,
              id,
            }));
          const {
            body,
            status,
          } = await putConfirmation(app, 'Bearer token');
          expect(body.errors).toBe(ALREADY_CONFIRMED);
          expect(status).toBe(401);
        });
        describe('confirmation token', () => {
          it('is not set', async () => {
            const {
              body,
              status,
            } = await putConfirmation(app);
            expect(body.errors).toBe(TOKEN_NOT_FOUND);
            expect(status).toBe(401);
          });
          it('is not \'Bearer ...\'', async () => {
            const {
              body,
              status,
            } = await putConfirmation(app, 'token');
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
          it('is not correct version', async () => {
            jest.spyOn(verifyConfirmation, 'confirmUser')
              .mockImplementationOnce(() => ({
                OK: true,
                confirmTokenVersion: user.confirmTokenVersion + 1,
                id: user.id,
              }));
            const {
              body,
              status,
            } = await putConfirmation(app, 'Bearer token');
            expect(body.errors).toBe(WRONG_TOKEN_VERSION);
            expect(status).toBe(401);
          });
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          jest.spyOn(verifyConfirmation, 'confirmUser')
            .mockImplementationOnce(() => ({
              OK: true,
              confirmTokenVersion: user.confirmTokenVersion,
              id: `${user.id}${user.id}`,
            }));
          const {
            body,
            status,
          } = await putConfirmation(app, 'Bearer token');
          expect(body.errors).toBe(USER_NOT_FOUND);
          expect(status).toBe(404);
        });
      });
    });
  });
});
