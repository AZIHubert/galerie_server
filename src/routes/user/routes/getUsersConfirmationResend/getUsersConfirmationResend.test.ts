import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';
import {
  ALREADY_CONFIRMED,
  USER_IS_LOGGED_IN,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';

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
  });
  describe('confirmation', () => {
    describe('resend', () => {
      describe('GET', () => {
        describe('should return status 200 and', () => {
          it('increment confirmTokenVersion', async () => {
            const { id, confirmTokenVersion } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: false,
            });
            const { status } = await request(initApp())
              .get('/users/confirmation/resend')
              .send({
                id,
              });
            const updatedUser = await User.findByPk(id);
            expect(status).toBe(204);
            expect(updatedUser!.confirmTokenVersion)
              .toBe(confirmTokenVersion + 1);
          });
          it('sign a token and send an email', async () => {
            const signMocked = jest.spyOn(jwt, 'sign');
            const emailMocked = jest.spyOn(email, 'sendConfirmAccount');
            const { id } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: false,
            });
            const { status } = await request(initApp())
              .get('/users/confirmation/resend')
              .send({
                id,
              });
            expect(status).toBe(204);
            expect(signMocked).toHaveBeenCalledTimes(1);
            expect(emailMocked).toHaveBeenCalledTimes(1);
          });
        });
        describe('should return error 401 if', () => {
          it('user is authenticated', async () => {
            const { status, body } = await request(initApp())
              .get('/users/confirmation/resend')
              .set('authorization', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: USER_IS_LOGGED_IN,
            });
          });
          it('id is not send', async () => {
            const { status, body } = await request(initApp())
              .get('/users/confirmation/resend')
              .send({});
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'user id is required',
            });
          });
          it('user id not found', async () => {
            const { status, body } = await request(initApp())
              .get('/users/confirmation/resend')
              .send({
                id: '1',
              });
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user is already confirmed', async () => {
            const { id } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            const { status, body } = await request(initApp())
              .get('/users/confirmation/resend')
              .send({
                id,
              });
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: ALREADY_CONFIRMED,
            });
          });
        });
      });
    });
  });
});
