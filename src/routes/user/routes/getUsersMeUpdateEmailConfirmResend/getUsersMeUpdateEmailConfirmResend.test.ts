import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import { createAccessToken } from '@src/helpers/auth';
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
  });
  describe('me', () => {
    describe('updateEmail', () => {
      describe('confirm', () => {
        describe('resend', () => {
          describe('GET', () => {
            it('should sign a token and send an email', async () => {
              const { id, emailTokenVersion, email: userEmail } = await User.create({
                userName: 'user',
                email: 'user@email.com',
                password: 'password',
                confirmed: true,
              });
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({
                  id,
                }))
                .mockImplementationOnce(() => ({
                  id,
                  emailTokenVersion,
                }));
              const emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
              const signMocked = jest.spyOn(jwt, 'sign');
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/confirm/resend')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token');
              expect(status).toBe(204);
              expect(emailMocked).toHaveBeenCalledTimes(1);
              expect(emailMocked).toBeCalledWith(userEmail, expect.any(String));
              expect(signMocked).toHaveBeenCalledTimes(1);
            });
            describe('should return error 401 if', () => {
              it('not logged in', async () => {
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: 'not authenticated',
                });
              });
              it('not confirmed', async () => {
                const user = await User.create({
                  userName: 'user',
                  email: 'user@email.com',
                  password: 'password',
                });
                const token = createAccessToken(user);
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend')
                  .set('authorization', `Bearer ${token}`);
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: 'You\'re account need to be confimed',
                });
              });
              describe('confirmation token', () => {
                let token: string;
                let id: string;
                let emailTokenVersion: number;
                beforeEach(async (done) => {
                  try {
                    const user = await User.create({
                      userName: 'user',
                      email: 'user@email.com',
                      password: 'password',
                      confirmed: true,
                    }, { raw: true });
                    token = createAccessToken(user);
                    id = user.id;
                    emailTokenVersion = user.emailTokenVersion;
                  } catch (err) {
                    done(err);
                  }
                  done();
                });
                it('is not found', async () => {
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', `Bearer ${token}`);
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: 'confirmation token not found',
                  });
                });
                it('is not \'Bearer token\'', async () => {
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', `Bearer ${token}`)
                    .set('confirmation', 'token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: 'wrong token',
                  });
                });
                it('id is not the same as current user id', async () => {
                  jest.spyOn(jwt, 'verify')
                    .mockImplementationOnce(() => ({
                      id,
                    }))
                    .mockImplementationOnce(() => ({
                      id: 10000,
                      emailTokenVersion,
                    }));
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', 'Bearer token')
                    .set('confirmation', 'Bearer token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: 'token id are not the same as your current id',
                  });
                });
                it('emailTokenVersion is not the same as current user emailTokenVersion', async () => {
                  jest.spyOn(jwt, 'verify')
                    .mockImplementationOnce(() => ({
                      id,
                    }))
                    .mockImplementationOnce(() => ({
                      id,
                      emailTokenVersion: 1,
                    }));
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', 'Bearer token')
                    .set('confirmation', 'Bearer token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: 'incorrect token version',
                  });
                });
              });
            });
            describe('should return error 404 if', () => {
              it('user not found', async () => {
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({
                    id: 1,
                  }));
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend')
                  .set('authorization', 'Bearer token');
                expect(status).toBe(404);
                expect(body).toStrictEqual({
                  errors: 'user not found',
                });
              });
            });
          });
        });
      });
    });
  });
});
