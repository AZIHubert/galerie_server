import { hash } from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
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
        .post('/users/login')
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
    jest.clearAllMocks();
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
      describe('POST', () => {
        describe('should return status 204 and', () => {
          it('create a token and send an email', async (done) => {
            try {
              const emailMock = jest.spyOn(email, 'sendUpdateEmailMessage');
              const signMock = jest.spyOn(jwt, 'sign');
              const { status } = await agent
                .post('/users/me/updateEmail/')
                .set('authorization', token)
                .send({
                  password: newUser.password,
                });
              expect(status).toBe(204);
              expect(emailMock).toHaveBeenCalledTimes(1);
              expect(signMock).toHaveBeenCalledTimes(1);
              done();
            } catch (err) {
              done(err);
            }
          });
          it('increment emailTokenVersion if resend is true', async () => {
            await agent
              .post('/users/me/updateEmail/')
              .set('authorization', token)
              .send({
                password: newUser.password,
                resend: true,
              });
            const { emailTokenVersion } = user;
            await user.reload();
            expect(user.emailTokenVersion).toBe(emailTokenVersion + 1);
          });
          it('not increment emailTokenVersion if resend is false', async () => {
            await agent
              .post('/users/me/updateEmail/')
              .set('authorization', token)
              .send({
                password: newUser.password,
              });
            const { emailTokenVersion } = user;
            await user.reload();
            expect(user.emailTokenVersion).toBe(emailTokenVersion);
          });
        });
        describe('should return error 400 if', () => {
          describe('password', () => {
            it('is not set', async () => {
              const { status, body } = await agent
                .post('/users/me/updateEmail')
                .set('authorization', token)
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: FIELD_IS_REQUIRED,
                },
              });
            });
            it('is not a string', async () => {
              const { status, body } = await agent
                .post('/users/me/updateEmail')
                .set('authorization', token)
                .send({
                  password: 123456,
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: FIELD_NOT_A_STRING,
                },
              });
            });
            it('is empty', async () => {
              const { status, body } = await agent
                .post('/users/me/updateEmail')
                .set('authorization', token)
                .send({
                  password: '',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: FIELD_IS_EMPTY,
                },
              });
            });
            it('not match user password', async () => {
              const { status, body } = await agent
                .post('/users/me/updateEmail')
                .set('authorization', token)
                .send({
                  password: 'wrongPassword',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: WRONG_PASSWORD,
                },
              });
            });
          });
        });
      });
    });
  });
});
