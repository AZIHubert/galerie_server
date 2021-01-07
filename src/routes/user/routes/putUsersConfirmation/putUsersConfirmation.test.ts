import request from 'supertest';
import jwt from 'jsonwebtoken';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

import { users, UserI } from '../../test.helper';

const sequelize = initSequelize();

const sendLoginRequest = async (user: UserI) => request(initApp()).post('/users/signin').send(user);

const CONFIRM_SECRET = accEnv('CONFIRM_SECRET');

describe('users', () => {
  let jwtMock: jest.SpyInstance;
  let id: string;

  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    const { body } = await sendLoginRequest(users.newUser);
    id = body.id;
    jwtMock = jest.spyOn(jwt, 'verify');
    jwtMock.mockImplementation(() => ({
      id,
    }));
    done();
  });
  afterEach(() => {
    jwtMock.mockRestore();
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
      it('should confirm his email', async () => {
        const { status } = await request(initApp())
          .put('/users/confirmation')
          .set('confirmation', 'Bearer abcd');
        const user = await User.findByPk(id, { raw: true });
        expect(status).toBe(200);
        expect(jwtMock).toHaveBeenCalledWith('abcd', CONFIRM_SECRET);
        expect(user?.confirmed).toBe(true);
      });
      it('should set cookie', async () => {
        const { header } = await request(initApp())
          .put('/users/confirmation')
          .set('confirmation', 'Bearer abcd');
        expect(header).toHaveProperty('set-cookie');
      });
      describe('should not be able to', () => {
        it(' create an account if is already authenticated', async () => {
          const { headers: { authorization } } = await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer abcd');
          const { body, status } = await request(initApp())
            .post('/users/signin')
            .set('authorization', `Bearer ${authorization}`)
            .send(users.newUser);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'you are already authenticated',
          });
        });
        describe('confirm twice if', () => {
          it('is already authenticated', async () => {
            const { headers: { authorization } } = await request(initApp())
              .put('/users/confirmation')
              .set('confirmation', 'Bearer abcd');
            const { body, status } = await request(initApp())
              .put('/users/confirmation')
              .set('confirmation', 'Bearer abcd')
              .set('authorization', `Bearer ${authorization}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'you are already authenticated',
            });
          });
        });
      });
      describe('should return error 401 if', () => {
        it('user is already active', async () => {
          await request(initApp())
            .put('/users/confirmation')
            .set('confirmation', 'Bearer abcd');
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
            const { body, status } = await request(initApp())
              .put('/users/confirmation');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'token not found',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
          it('is not "Bearer ..."', async () => {
            const { body, status } = await request(initApp())
              .put('/users/confirmation')
              .set('confirmation', 'abcde');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'wrong token',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
        });
      });
    });
  });
});
