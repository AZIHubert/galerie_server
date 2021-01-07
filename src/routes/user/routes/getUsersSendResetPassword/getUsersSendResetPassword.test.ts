import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const sequelize = initSequelize();

describe('users', () => {
  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    done();
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
  describe('sendResetPassword', () => {
    describe('GET', () => {
      it('should return error 404 if email is not found', async () => {
        await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          admin: false,
          confirmed: true,
        });
        const { body, status } = await request(initApp()).get('/users/sendResetPassword').send({
          email: 'user2@email.com',
        });
        expect(status).toBe(404);
        expect(body).toStrictEqual({
          errors: {
            email: 'user not found',
          },
        });
      });
      it('should send an email with and sign a token', async () => {
        const resetPasswordMessageMocked = jest.spyOn(email, 'sendResetPassword');
        const jwtMocked = jest.spyOn(jwt, 'sign');
        const { email: userEmail } = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          admin: false,
          confirmed: true,
        });
        await request(initApp()).get('/users/sendResetPassword').send({
          email: userEmail,
        });
        expect(jwtMocked).toHaveBeenCalledTimes(1);
        expect(resetPasswordMessageMocked).toHaveBeenCalledTimes(1);
        jest.restoreAllMocks();
      });
      it('should return error 500 if jwt fail to sign', async () => {
        jest.spyOn(jwt, 'sign').mockImplementation(() => {
          throw new Error('something went wrong');
        });
        const { email: userEmail } = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          admin: false,
          confirmed: true,
        });
        const { status } = await request(initApp()).get('/users/sendResetPassword').send({
          email: userEmail,
        });
        expect(status).toBe(500);
      });
      describe('should return error 400 if', () => {
        it('not a valid email', async () => {
          const { body, status } = await request(initApp()).get('/users/sendResetPassword').send({
            email: 'abcde',
          });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'should be a valid email',
            },
          });
        });
        it('email is not set', async () => {
          const { body, status } = await request(initApp()).get('/users/sendResetPassword').send({});
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'is required',
            },
          });
        });
        it('email is empty', async () => {
          const { body, status } = await request(initApp()).get('/users/sendResetPassword').send({
            email: '',
          });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              email: 'cannot be an empty field',
            },
          });
        });
      });
    });
  });
});
