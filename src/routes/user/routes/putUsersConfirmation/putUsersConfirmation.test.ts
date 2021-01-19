import request from 'supertest';
import jwt from 'jsonwebtoken';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  ALREADY_CONFIRMED,
  USER_IS_LOGGED_IN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const sequelize = initSequelize();

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

describe('users', () => {
  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
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
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    sequelize.close();
    done();
  });

  describe('confirmation', () => {
    describe('PUT', () => {
      describe('should return status 200 and', () => {
        let jwtMock: jest.SpyInstance;
        let user: User;
        beforeEach(async (done) => {
          try {
            user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: false,
            });
            jwtMock = jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
                confirmTokenVersion: user.confirmTokenVersion,
              }));
            done();
          } catch (err) {
            done(err);
          }
        });
        it('increment confirmTokenVersion', async () => {
          await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer token');
          const updatedUser = await User.findByPk(user.id);
          expect(updatedUser?.confirmTokenVersion).toBe(user.confirmTokenVersion + 1);
        });
        it('confirm his email and send access/refresh token', async () => {
          const { status, header, body } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer token');
          await user.reload();
          expect(status).toBe(200);
          expect(jwtMock).toHaveBeenCalledWith('token', CONFIRM_SECRET);
          expect(user.confirmed).toBe(true);
          expect(header).toHaveProperty('set-cookie');
          expect(body).toHaveProperty('accessToken');
        });
      });
      describe('should return error 401 if', () => {
        it('user is already authenticated', async () => {
          const { headers: { authorization } } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer token');
          const { body, status } = await request(initApp())
            .post('/users/signin')
            .set('authorization', `Bearer ${authorization}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: USER_IS_LOGGED_IN,
          });
        });
        it('if is already authenticated', async () => {
          const { body, status } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer token')
            .set('authorization', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: USER_IS_LOGGED_IN,
          });
        });
        it('user is already confirmed', async () => {
          const { id, confirmTokenVersion } = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: 'password',
            confirmed: true,
          });
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id, confirmTokenVersion }));
          const { body, status } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer abcd');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: ALREADY_CONFIRMED,
          });
        });
        describe('confirmation token', () => {
          it('not found', async () => {
            const jwtMock = jest.spyOn(jwt, 'verify');
            const { body, status } = await request(initApp())
              .put('/users/confirmation');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'token not found',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
          it('is not "Bearer ..."', async () => {
            const jwtMock = jest.spyOn(jwt, 'verify');
            const { body, status } = await request(initApp())
              .put('/users/confirmation')
              .set('confirmation', 'abcde');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'wrong token',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
          it('is not correct version', async () => {
            const { id } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: false,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementation(() => ({
                id,
                confirmTokenVersion: 1,
              }));
            const { body, status } = await request(initApp())
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
