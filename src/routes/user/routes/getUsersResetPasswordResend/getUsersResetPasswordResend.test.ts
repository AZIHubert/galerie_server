import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
  USER_IS_LOGGED_IN,
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
    describe('resend', () => {
      describe('GET', () => {
        describe('should return status 204 and', () => {
          it('increment resetPasswordTokenVersion', async () => {
            const {
              id,
              email: userEmail,
              resetPasswordTokenVersion,
            } = await User.create({
              ...newUser,
              confirmed: true,
            });
            await request(initApp())
              .get('/users/resetPassword/resend')
              .send({
                email: userEmail,
              });
            const updatedUser = await User.findByPk(id, { raw: true });
            expect(updatedUser!.resetPasswordTokenVersion).toBe(resetPasswordTokenVersion + 1);
          });
          it('send an email with and sign a token', async () => {
            const resetPasswordMessageMocked = jest.spyOn(email, 'sendResetPassword');
            const jwtMocked = jest.spyOn(jwt, 'sign');
            const { email: userEmail } = await User.create({
              ...newUser,
              confirmed: true,
            });
            await request(initApp())
              .get('/users/resetPassword/resend')
              .send({
                email: userEmail,
              });
            expect(jwtMocked).toHaveBeenCalledTimes(1);
            expect(resetPasswordMessageMocked).toHaveBeenCalledTimes(1);
          });
        });
        describe('should return error 400 if', () => {
          it('email is not sent', async () => {
            const { body, status } = await request(initApp())
              .get('/users/resetPassword/resend')
              .send({});
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: FIELD_IS_REQUIRED,
            });
          });
        });
        describe('should return error 401 if', () => {
          it('user is logged in', async () => {
            const { body, status } = await request(initApp())
              .get('/users/resetPassword/resend')
              .set('authorization', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: USER_IS_LOGGED_IN,
            });
          });
        });
        describe('should return error 404 if', () => {
          it('user email is not found', async () => {
            const { body, status } = await request(initApp())
              .get('/users/resetPassword/resend')
              .send({
                email: 'user@email.com',
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
