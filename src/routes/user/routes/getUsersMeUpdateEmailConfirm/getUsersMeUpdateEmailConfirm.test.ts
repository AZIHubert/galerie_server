import { hash } from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import initSequelize from '@src/helpers/initSequelize.js';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  TOKEN_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const clearDatas = async () => {
  await User.sync({ force: true });
};

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'user',
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas();
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      await agent
        .get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  afterAll(async (done) => {
    try {
      await clearDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('me', () => {
    describe('updateEmail', () => {
      describe('confirm', () => {
        describe('GET', () => {
          describe('should return status 200 and', () => {
            const newEmail = 'user2@email.com';
            let emailMocked: jest.SpyInstance;
            let response: request.Response;
            let signMocked: jest.SpyInstance;
            beforeEach(async (done) => {
              const { id, emailTokenVersion } = user;
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id, emailTokenVersion }));
              emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
              signMocked = jest.spyOn(jwt, 'sign');
              try {
                response = await agent
                  .get('/users/me/updateEmail/confirm')
                  .set('confirmation', 'Bearer token')
                  .send({
                    email: newEmail,
                  });
              } catch (err) {
                done(err);
              }
              done();
            });
            it('should increment emailTokenVersion', async () => {
              const { emailTokenVersion } = user;
              await user.reload();
              expect(user.emailTokenVersion).toBe(emailTokenVersion + 1);
            });
            it('send an email and sign a token', async () => {
              const { status } = response;
              expect(status).toBe(204);
              expect(signMocked).toHaveBeenCalledTimes(1);
              expect(emailMocked).toBeCalledWith(newEmail, expect.any(String));
              expect(emailMocked).toHaveBeenCalledTimes(1);
            });
          });
          describe('should return 400 if email', () => {
            beforeEach(() => {
              const { id, emailTokenVersion } = user;
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id, emailTokenVersion }));
            });
            it('is empty', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer confirmToken')
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_IS_REQUIRED,
                },
              });
            });
            it('is an empty string', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: '',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_IS_EMPTY,
                },
              });
            });
            it('is not a string', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 12345678,
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_NOT_A_STRING,
                },
              });
            });
            it('is not an email', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 'hello world',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_IS_EMAIL,
                },
              });
            });
            it('is the same than the old one', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 'user@email.com',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: 'should be a different one',
                },
              });
            });
          });
          describe('should return 401 if', () => {
            it('not found', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: TOKEN_NOT_FOUND,
              });
            });
            it('is not \'Bearer ...\'', async () => {
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN,
              });
            });
            it('is not correct version', async () => {
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({
                  id: user.id,
                  emailTokenVersion: user.emailTokenVersion + 1,
                }));
              const { status, body } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN_VERSION,
              });
            });
            it('id and user.id are not the same', async () => {
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({
                  id: 10000,
                  emailTokenVersion: user.emailTokenVersion,
                }));
              const { body, status } = await agent
                .get('/users/me/updateEmail/confirm')
                .set('confirmation', 'Bearer token');
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN_USER_ID,
              });
              expect(status).toBe(401);
            });
          });
        });
      });
    });
  });
});
