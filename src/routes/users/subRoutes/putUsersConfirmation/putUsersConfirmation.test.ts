import { Server } from 'http';
import { sign } from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import accEnv from '#src/helpers/accEnv';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
  USER_SHOULD_NOT_BE_CONFIRMED,
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import {
  createUser,
  putUsersConfirmation,
} from '#src/helpers/test';
import * as verifyConfirmation from '#src/helpers/verifyConfirmation';

import initApp from '#src/server';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');
let app: Server;
let sequelize: Sequelize;
let user: User;

describe('/users', () => {
  describe('/confirmation', () => {
    describe('PUT', () => {
      beforeAll(() => {
        app = initApp();
        sequelize = initSequelize();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const { user: createdUser } = await createUser({
            confirmed: false,
          });

          user = createdUser;
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
        it('return a token', async () => {
          jest.spyOn(verifyConfirmation, 'confirmUser')
            .mockImplementationOnce(() => ({
              OK: true,
              confirmTokenVersion: user.confirmTokenVersion,
              id: user.id,
            }));
          const {
            body: {
              data: {
                expiresIn,
                token,
              },
            },
            status,
          } = await putUsersConfirmation(app, {
            confirmToken: 'Bearer token',
          });
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
          await putUsersConfirmation(app, {
            confirmToken: 'Bearer token',
          });
          const { confirmTokenVersion } = user;
          const { confirmed } = await user.reload();
          expect(confirmed).toBeTruthy();
          expect(user.confirmTokenVersion).toBe(confirmTokenVersion + 1);
        });
      });
      describe('should return status 400 if', () => {
        it('confirmToken.id is not a UUIDv4', async () => {
          const confirmToken = sign(
            {
              id: '100',
              confirmTokenVersion: user.confirmTokenVersion,
            },
            CONFIRM_SECRET,
            {
              expiresIn: '2d',
            },
          );
          const {
            body,
            status,
          } = await putUsersConfirmation(app, {
            confirmToken: `Bearer ${confirmToken}`,
          });
          expect(body.errors).toBe(`confirmation token error: ${INVALID_UUID('user')}`);
          expect(status).toBe(400);
        });
      });
      describe('should return status 401 if', () => {
        it('user is already confirmed', async () => {
          const {
            user: {
              confirmTokenVersion,
              id,
            },
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
          } = await putUsersConfirmation(app, {
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(USER_SHOULD_NOT_BE_CONFIRMED);
          expect(status).toBe(401);
        });
        describe('confirmation token', () => {
          it('is not set', async () => {
            const {
              body,
              status,
            } = await putUsersConfirmation(app);
            expect(body.errors).toBe(TOKEN_NOT_FOUND);
            expect(status).toBe(401);
          });
          it('is not \'Bearer ...\'', async () => {
            const {
              body,
              status,
            } = await putUsersConfirmation(app, {
              confirmToken: 'token',
            });
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
            } = await putUsersConfirmation(app, {
              confirmToken: 'Bearer token',
            });
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
              id: uuidv4(),
            }));
          const {
            body,
            status,
          } = await putUsersConfirmation(app, {
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
