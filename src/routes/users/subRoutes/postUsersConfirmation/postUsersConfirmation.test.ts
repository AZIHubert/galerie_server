import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import * as email from '@src/helpers/email';
import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  MODEL_NOT_FOUND,
  USER_SHOULD_NOT_BE_CONFIRMED,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postUsersConfirmation,
} from '@src/helpers/test';

import initApp from '@src/server';

const signMocked = jest.spyOn(jwt, 'sign');
const emailMocked = jest.spyOn(email, 'sendConfirmAccount');

describe('/users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    jest.clearAllMocks();
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

  describe('/confirmation', () => {
    describe('POST', () => {
      describe('should return status 204 and', () => {
        it('increment confirmTokenVersion', async () => {
          const {
            email: userEmail,
            confirmTokenVersion,
          } = user;
          const { status } = await postUsersConfirmation(app, {
            email: userEmail,
          });
          await user.reload();
          expect(status).toBe(204);
          expect(user.confirmTokenVersion).toBe(confirmTokenVersion + 1);
        });
        it('sign a token and send an email', async () => {
          const { status } = await postUsersConfirmation(app, {
            email: user.email,
          });
          expect(status).toBe(204);
          expect(signMocked).toHaveBeenCalledTimes(1);
          expect(emailMocked).toHaveBeenCalledTimes(1);
        });
      });
      describe('should return status 400 if', () => {
        it('user is already confirmed', async () => {
          const { email: userEmail } = await createUser({
            userName: 'user2',
            email: 'user2@email.com',
          });
          const {
            body,
            status,
          } = await postUsersConfirmation(app, {
            email: userEmail,
          });
          expect(body.errors).toBe(USER_SHOULD_NOT_BE_CONFIRMED);
          expect(status).toBe(400);
        });
        describe('email', () => {
          it('is not send', async () => {
            const {
              body,
              status,
            } = await postUsersConfirmation(app, {});
            expect(body.errors).toEqual({
              email: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await postUsersConfirmation(app, {
              email: 1234,
            });
            expect(body.errors).toEqual({
              email: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await postUsersConfirmation(app, {
              email: '',
            });
            expect(body.errors).toEqual({
              email: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not an email', async () => {
            const {
              body,
              status,
            } = await postUsersConfirmation(app, {
              email: 'not an email',
            });
            expect(body.errors).toEqual({
              email: FIELD_SHOULD_BE_AN_EMAIL,
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return status 404 if', () => {
        it('user id not found', async () => {
          const {
            body,
            status,
          } = await postUsersConfirmation(app, {
            email: 'unexistedEmail@email.com',
          });
          expect(body.errors).toEqual({
            email: MODEL_NOT_FOUND('user'),
          });
          expect(status).toBe(404);
        });
      });
    });
  });
});
