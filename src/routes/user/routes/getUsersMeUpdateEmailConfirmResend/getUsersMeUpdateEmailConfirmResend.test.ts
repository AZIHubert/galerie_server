import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { hash } from 'bcrypt';
import User from '@src/db/models/user';
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
import initSequelize from '@src/helpers/initSequelize.js';
import * as verifyConfirmation from '@src/helpers/verifyConfirmation';
import initApp from '@src/server';

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

const newUser = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  let token: string;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas(sequelize);
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      const { body } = await agent
        .get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
      token = body.token;
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
      await clearDatas(sequelize);
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
        describe('resend', () => {
          describe('GET', () => {
            describe('should return status 200 and', () => {
              let response: request.Response;
              let emailMocked: jest.SpyInstance;
              let signMocked: jest.SpyInstance;
              beforeEach(async (done) => {
                const { id, emailTokenVersion } = user;
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({ OK: true, id, emailTokenVersion }));
                emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
                signMocked = jest.spyOn(jwt, 'sign');
                try {
                  response = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token')
                    .send({
                      email: 'user2@email.com',
                    });
                } catch (err) {
                  done(err);
                }
                done();
              });
              it('increment updatedEmailTokenVersion', async () => {
                const { status } = response;
                const { updatedEmailTokenVersion } = user;
                await user.reload();
                expect(status).toBe(204);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('sign a token and send an email', async () => {
                const { status } = response;
                expect(status).toBe(204);
                expect(emailMocked).toHaveBeenCalledTimes(1);
                expect(emailMocked).toBeCalledWith(user.email, expect.any(String));
                expect(signMocked).toHaveBeenCalledTimes(1);
              });
              it('should trim req email', async () => {
                const { id, emailTokenVersion } = await user.reload();
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({ OK: true, id, emailTokenVersion }));
                const { status } = await agent
                  .get('/users/me/updateEmail/confirm/resend')
                  .set('authorization', token)
                  .set('confirmation', 'Bearer token')
                  .send({ email: ' user2@email.com ' });
                expect(status).toBe(204);
              });
            });
            describe('should return error 400 if', () => {
              beforeEach(() => {
                const { id, emailTokenVersion } = user;
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({ OK: true, id, emailTokenVersion }));
              });
              describe('email', () => {
                it('is not send', async () => {
                  const { id, emailTokenVersion } = user;
                  jest.spyOn(verifyConfirmation, 'sendEmailToken')
                    .mockImplementationOnce(() => ({ OK: true, id, emailTokenVersion }));
                  const { body, status } = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token')
                    .send({});
                  expect(status).toBe(400);
                  expect(body).toStrictEqual({
                    errors: { email: FIELD_IS_REQUIRED },
                  });
                });
                it('is an empty string', async () => {
                  const { status, body } = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token')
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
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token')
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
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token')
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
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer confirmToken')
                    .send({
                      email: user.email,
                    });
                  expect(status).toBe(400);
                  expect(body).toStrictEqual({
                    errors: {
                      email: 'should be a different one',
                    },
                  });
                });
              });
            });
            describe('should return error 401 if', () => {
              describe('confirmation token', () => {
                it('is not found', async () => {
                  const { body, status } = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token);
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: TOKEN_NOT_FOUND,
                  });
                });
                it('is not \'Bearer token\'', async () => {
                  const { body, status } = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: WRONG_TOKEN,
                  });
                });
                it('id is not the same as current user id', async () => {
                  jest.spyOn(verifyConfirmation, 'sendEmailToken')
                    .mockImplementationOnce(() => ({
                      OK: true,
                      id: '10000',
                      emailTokenVersion: user.emailTokenVersion,
                    }));
                  const { body, status } = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: WRONG_TOKEN_USER_ID,
                  });
                });
                it('emailTokenVersion is not the same as current user emailTokenVersion', async () => {
                  jest.spyOn(verifyConfirmation, 'sendEmailToken')
                    .mockImplementationOnce(() => ({
                      OK: true,
                      id: user.id,
                      emailTokenVersion: user.emailTokenVersion + 1,
                    }));
                  const { body, status } = await agent
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', token)
                    .set('confirmation', 'Bearer token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: WRONG_TOKEN_VERSION,
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
