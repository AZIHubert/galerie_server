import request from 'supertest';
import jwt from 'jsonwebtoken';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
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
      it('should confirm his email and send access/refresh token', async () => {
        const { id } = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: false,
          admin: true,
          authTokenVersion: 0,
          confirmTokenVersion: 0,
        });
        const jwtMock = jest.spyOn(jwt, 'verify')
          .mockImplementationOnce(() => ({
            id,
            confirmTokenVersion: 0,
          }));
        const { status, header, body } = await request(initApp())
          .put('/users/confirmation')
          .set('confirmation', 'Bearer abcd');
        const user = await User.findByPk(id, { raw: true });
        expect(status).toBe(200);
        expect(jwtMock).toHaveBeenCalledWith('abcd', CONFIRM_SECRET);
        expect(user?.confirmed).toBe(true);
        expect(header).toHaveProperty('set-cookie');
        expect(body).toHaveProperty('accessToken');
      });
      describe('should not be able to', () => {
        it('create an account if is already authenticated', async () => {
          const { id } = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: 'password',
            confirmed: false,
            admin: true,
            authTokenVersion: 0,
            confirmTokenVersion: 1,
          });
          jest.spyOn(jwt, 'verify')
            .mockImplementation(() => ({
              id,
              authTokenVersion: 0,
            }));
          const { headers: { authorization } } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer abcd');
          const { body, status } = await request(initApp())
            .post('/users/signin')
            .set('authorization', `Bearer ${authorization}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'you are already authenticated',
          });
        });
        it('confirm twice if is already authenticated', async () => {
          const { body, status } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer token')
            .set('authorization', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'you are already authenticated',
          });
        });
      });
    });
    describe('should return error 401 if', () => {
      it('user is already confirmed', async () => {
        const { id, confirmTokenVersion } = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
          admin: false,
          authTokenVersion: 0,
          confirmTokenVersion: 0,
        });
        jest.spyOn(jwt, 'verify')
          .mockImplementationOnce(() => ({
            id,
            confirmTokenVersion,
          }));
        const { body, status } = await request(initApp())
          .put('/users/confirmation')
          .set('confirmation', 'Bearer abcd');
        expect(status).toBe(401);
        expect(body).toStrictEqual({
          errors: 'your account is already confirmed',
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
            admin: true,
            authTokenVersion: 0,
            confirmTokenVersion: 0,
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
            errors: 'wrong token version',
          });
        });
      });
    });
  });
});
