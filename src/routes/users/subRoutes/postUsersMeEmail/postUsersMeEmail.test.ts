import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import * as email from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_CANNOT_BE_EMPTY,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  login,
  postUpdateEmail,
} from '@src/helpers/test';

import initApp from '@src/server';

const emailMock = jest.spyOn(email, 'sendUpdateEmailMessage');
const signMock = jest.spyOn(jwt, 'sign');
const userPassword = 'Password0!';

describe('/users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
    } catch (err) {
      done(err);
    }
    jest.clearAllMocks();
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

  describe('/me', () => {
    describe('/updateEmail', () => {
      describe('POST', () => {
        describe('should return status 204 and', () => {
          it('create a token and send an email', async (done) => {
            const { status } = await postUpdateEmail(app, token, {
              password: userPassword,
            });
            expect(status).toBe(204);
            expect(emailMock).toHaveBeenCalledTimes(1);
            expect(signMock).toHaveBeenCalledTimes(1);
            done();
          });
          it('increment emailTokenVersion if resend is true', async () => {
            await postUpdateEmail(app, token, {
              password: userPassword,
            });
            const { emailTokenVersion } = user;
            await user.reload();
            expect(user.emailTokenVersion).toBe(emailTokenVersion + 1);
          });
        });
        describe('should return error 400 if', () => {
          describe('password', () => {
            it('is not set', async () => {
              const {
                body,
                status,
              } = await postUpdateEmail(app, token, {});
              expect(body.errors).toEqual({
                password: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await postUpdateEmail(app, token, {
                password: 1234,
              });
              expect(body.errors).toEqual({
                password: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is empty', async () => {
              const {
                body,
                status,
              } = await postUpdateEmail(app, token, {
                password: '',
              });
              expect(body.errors).toEqual({
                password: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('not match user password', async () => {
              const {
                body,
                status,
              } = await postUpdateEmail(app, token, {
                password: 'wrong password',
              });
              expect(body.errors).toEqual({
                password: WRONG_PASSWORD,
              });
              expect(status).toBe(400);
            });
          });
        });
      });
    });
  });
});
