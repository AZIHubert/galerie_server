import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import accEnv from '@src/helpers/accEnv';
import {
  ALREADY_CONFIRMED,
  USER_IS_LOGGED_IN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

const cleanDatas = async () => {
  await User.sync({ force: true });
};

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
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
      await cleanDatas();
    } catch (err) {
      done(err);
    }
    done();
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  afterAll(async (done) => {
    try {
      await cleanDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('confirmation', () => {
    describe('PUT', () => {
      describe('should return status 204 and', () => {
        let jwtMock: jest.SpyInstance;
        let response: request.Response;
        beforeEach(async (done) => {
          try {
            const hashPassword = await hash(newUser.password, saltRounds);
            user = await User.create({
              ...newUser,
              password: hashPassword,
            });
            jwtMock = jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
                confirmTokenVersion: user.confirmTokenVersion,
              }));
            response = await agent.put('/users/confirmation')
              .set('confirmation', 'Bearer token');
            done();
          } catch (err) {
            done(err);
          }
        });
        it('increment confirmTokenVersion', async () => {
          const { status } = response;
          const { confirmTokenVersion } = user;
          await user.reload();
          expect(status).toBe(204);
          expect(user.confirmTokenVersion).toBe(confirmTokenVersion + 1);
        });
        it('confirm his email and send access/refresh token', async () => {
          const { status, headers } = response;
          await user.reload();
          expect(status).toBe(204);
          expect(jwtMock).toHaveBeenCalledTimes(1);
          expect(jwtMock).toHaveBeenCalledWith('token', CONFIRM_SECRET);
          expect(user.confirmed).toBe(true);
          expect(headers).toHaveProperty('set-cookie');
        });
      });
      describe('should return error 401 if', () => {
        beforeEach(async (done) => {
          try {
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
        it('user is already authenticated', async () => {
          const { id, confirmTokenVersion } = user;
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id, confirmTokenVersion }));
          await agent
            .get('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: user.userName,
            });
          const { body, status } = await agent.put('/users/confirmation')
            .set('confirmation', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: USER_IS_LOGGED_IN,
          });
        });
        it('user is already confirmed', async () => {
          const { id, confirmTokenVersion } = user;
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id, confirmTokenVersion }));
          const { body, status } = await request(app)
            .put('/users/confirmation')
            .set('confirmation', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: ALREADY_CONFIRMED,
          });
        });
        describe('confirmation token', () => {
          it('not found', async () => {
            const jwtMock = jest.spyOn(jwt, 'verify');
            const { body, status } = await request(app)
              .put('/users/confirmation');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'token not found',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
          it('is not "Bearer ..."', async () => {
            const jwtMock = jest.spyOn(jwt, 'verify');
            const { body, status } = await request(app)
              .put('/users/confirmation')
              .set('confirmation', 'abcde');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'wrong token',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
          it('is not correct version', async () => {
            const { id, confirmTokenVersion } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementation(() => ({
                id,
                confirmTokenVersion: confirmTokenVersion + 1,
              }));
            const { body, status } = await request(app)
              .put('/users/confirmation')
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
