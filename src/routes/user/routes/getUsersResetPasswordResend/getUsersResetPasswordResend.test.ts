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
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
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
    app = initApp();
    sequelize = initSequelize();
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
  describe('resetPassword', () => {
    describe('resend', () => {
      describe('GET', () => {
        describe('should return status 204 and', () => {
          let response: request.Response;
          let emailMocked: jest.SpyInstance;
          let jwtMocked: jest.SpyInstance;
          beforeEach(async (done) => {
            emailMocked = jest.spyOn(email, 'sendResetPassword');
            jwtMocked = jest.spyOn(jwt, 'sign');
            try {
              response = await agent
                .get('/users/resetPassword/resend')
                .send({
                  email: user.email,
                });
            } catch (err) {
              done(err);
            }
            done();
          });
          it('increment resetPasswordTokenVersion', async () => {
            const { status } = response;
            expect(status).toBe(204);
            const { resetPasswordTokenVersion } = user;
            await user.reload();
            expect(user.resetPasswordTokenVersion).toBe(resetPasswordTokenVersion + 1);
          });
          it('send an email with and sign a token', async () => {
            const { status } = response;
            expect(status).toBe(204);
            expect(jwtMocked).toHaveBeenCalledTimes(1);
            expect(emailMocked).toHaveBeenCalledTimes(1);
            expect(emailMocked).toBeCalledWith(user.email, expect.any(String));
          });
        });
        describe('should return error 400 if', () => {
          it('email is not sent', async () => {
            const { body, status } = await agent
              .get('/users/resetPassword/resend')
              .send({});
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: FIELD_IS_REQUIRED,
            });
          });
        });
        describe('should return error 404 if', () => {
          it('user email is not found', async () => {
            const { body, status } = await agent
              .get('/users/resetPassword/resend')
              .send({
                email: 'user2@email.com',
              });
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
        });
      });
    });
  });
});
