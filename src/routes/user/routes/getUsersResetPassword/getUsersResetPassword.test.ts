import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  NOT_CONFIRMED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const sequelize = initSequelize();

const newUser = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

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
    jest.restoreAllMocks();
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
  describe('resetPassword', () => {
    describe('GET', () => {
      describe('should return status 204 and', () => {
        it('send an email with and sign a token', async () => {
          const resetPasswordMessageMocked = jest.spyOn(email, 'sendResetPassword');
          const jwtMocked = jest.spyOn(jwt, 'sign');
          const { email: userEmail } = await User.create({
            ...newUser,
            confirmed: true,
          });
          const { body, status } = await request(initApp())
            .get('/users/resetPassword')
            .send({
              email: userEmail,
            });
          expect(status).toBe(204);
          expect(body).toStrictEqual({});
          expect(jwtMocked).toHaveBeenCalledTimes(1);
          expect(resetPasswordMessageMocked).toHaveBeenCalledTimes(1);
        });
      });
      describe('should return error 400 if', () => {
        it('not a valid email', async () => {
          const { body, status } = await request(initApp())
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
          const { body, status } = await request(initApp())
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
          const { body, status } = await request(initApp())
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
          await User.create({
            ...newUser,
            confirmed: true,
          });
          const { body, status } = await request(initApp())
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
      describe('should return error 401 if', () => {
        it('user is not confirmed', async () => {
          const { email: userEmail } = await User.create(newUser);
          const { status, body } = await request(initApp())
            .get('/users/resetPassword')
            .send({
              email: userEmail,
            });
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
      });
    });
  });
});
