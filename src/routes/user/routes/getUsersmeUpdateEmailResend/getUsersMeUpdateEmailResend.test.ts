import { hash } from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
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
  email: 'user@email',
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
      describe('resend', () => {
        describe('GET', () => {
          let emailMocked: jest.SpyInstance;
          let response: request.Response;
          let signMocked: jest.SpyInstance;
          beforeEach(async (done) => {
            try {
              emailMocked = jest.spyOn(email, 'sendUpdateEmailMessage');
              signMocked = jest.spyOn(jwt, 'sign');
              response = await agent
                .get('/users/me/updateEmail/resend')
                .set('authorization', token)
                .send({
                  password: newUser.password,
                });
            } catch (err) {
              done(err);
            }
            done();
          });
          describe('should return status 201 and', () => {
            it('increment emailTokenVersion', async () => {
              const { emailTokenVersion } = user;
              await user.reload();
              expect(user.emailTokenVersion).toBe(emailTokenVersion + 1);
            });
            it('sign a token and send an email', async () => {
              const { status } = response;
              expect(status).toBe(201);
              expect(emailMocked).toHaveBeenCalledTimes(1);
              expect(emailMocked).toBeCalledWith(user.email, expect.any(String));
              expect(signMocked).toHaveBeenCalledTimes(1);
            });
          });
          describe('return error 400 if', () => {
            it('password not send', async () => {
              const { body, status } = await agent
                .get('/users/me/updateEmail/resend')
                .set('authorization', token)
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: FIELD_IS_REQUIRED,
              });
            });
            it('passwords not match', async () => {
              const { body, status } = await agent
                .get('/users/me/updateEmail/resend')
                .set('authorization', token)
                .send({
                  password: 'wrongPassword',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: WRONG_PASSWORD,
              });
            });
          });
        });
      });
    });
  });
});
