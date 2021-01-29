import { hash } from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  USER_NOT_FOUND,
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
  beforeEach(() => {
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
  describe('resetPassword', () => {
    describe('GET', () => {
      describe('should return status 204 and', () => {
        it('send an email with and sign a token', async () => {
          const emailMocked = jest.spyOn(email, 'sendResetPassword');
          const jwtMocked = jest.spyOn(jwt, 'sign');
          const { status } = await agent
            .get('/users/resetPassword')
            .send({
              email: user.email,
            });
          expect(status).toBe(204);
          expect(jwtMocked).toHaveBeenCalledTimes(1);
          expect(emailMocked).toHaveBeenCalledTimes(1);
          expect(emailMocked).toBeCalledWith(user.email, expect.any(String));
        });
        it('trim req email', async () => {
          const { status } = await agent
            .get('/users/resetPassword')
            .send({
              email: ` ${user.email} `,
            });
          expect(status).toBe(204);
        });
      });
      describe('should return error 400 if', () => {
        it('not a valid email', async () => {
          const { body, status } = await agent
            .get('/users/resetPassword')
            .send({
              email: 'abcde',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: FIELD_IS_EMAIL,
            },
          });
        });
        it('email is not set', async () => {
          const { body, status } = await agent
            .get('/users/resetPassword')
            .send({});
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: FIELD_IS_REQUIRED,
            },
          });
        });
        it('email is empty', async () => {
          const { body, status } = await agent
            .get('/users/resetPassword')
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
      });
      describe('should return error 404 if', () => {
        it('email is not found', async () => {
          const { body, status } = await agent
            .get('/users/resetPassword')
            .send({
              email: 'user2@email.com',
            });
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: {
              email: USER_NOT_FOUND,
            },
          });
        });
      });
    });
  });
});
