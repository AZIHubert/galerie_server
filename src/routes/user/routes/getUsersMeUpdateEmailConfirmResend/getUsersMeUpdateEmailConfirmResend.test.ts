import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  TOKEN_NOT_FOUND,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
  WRONG_TOKEN_USER_ID,
} from '@src/helpers/errorMessages';
import { createAccessToken } from '@src/helpers/auth';
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
            describe('should return status 200 and', () => {
              let user: User;
              beforeEach(async () => {
                user = await User.create({
                  ...newUser,
                  confirmed: true,
                });
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({ id: user.id }))
                  .mockImplementationOnce(() => ({
                    id: user.id,
                    emailTokenVersion: user.emailTokenVersion,
                  }));
              });
              it('increment updatedEmailTokenVersion', async () => {
                const { id, updatedEmailTokenVersion } = user;
                const { status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend')
                  .set('authorization', 'Bearer token')
                  .set('confirmation', 'Bearer token');
                const updatedUser = await User.findByPk(id);
                expect(status).toBe(204);
                expect(updatedUser?.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('sign a token and send an email', async () => {
                const { email: userEmail } = user;
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
            });
            describe('should return error 401 if', () => {
              it('not logged in', async () => {
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: NOT_AUTHENTICATED,
                });
              });
              it('not confirmed', async () => {
                const user = await User.create(newUser);
                const token = createAccessToken(user);
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend')
                  .set('authorization', `Bearer ${token}`);
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: NOT_CONFIRMED,
                });
              });
              describe('confirmation token', () => {
                let token: string;
                let id: string;
                let emailTokenVersion: number;
                beforeEach(async (done) => {
                  try {
                    const user = await User.create({
                      ...newUser,
                      confirmed: true,
                    });
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
                    errors: TOKEN_NOT_FOUND,
                  });
                });
                it('is not \'Bearer token\'', async () => {
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', `Bearer ${token}`)
                    .set('confirmation', 'token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: WRONG_TOKEN,
                  });
                });
                it('id is not the same as current user id', async () => {
                  jest.spyOn(jwt, 'verify')
                    .mockImplementationOnce(() => ({ id }))
                    .mockImplementationOnce(() => ({ id: 10000, emailTokenVersion }));
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', 'Bearer token')
                    .set('confirmation', 'Bearer token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: WRONG_TOKEN_USER_ID,
                  });
                });
                it('emailTokenVersion is not the same as current user emailTokenVersion', async () => {
                  jest.spyOn(jwt, 'verify')
                    .mockImplementationOnce(() => ({ id }))
                    .mockImplementationOnce(() => ({ id, emailTokenVersion: 1 }));
                  const { body, status } = await request(initApp())
                    .get('/users/me/updateEmail/confirm/resend')
                    .set('authorization', 'Bearer token')
                    .set('confirmation', 'Bearer token');
                  expect(status).toBe(401);
                  expect(body).toStrictEqual({
                    errors: WRONG_TOKEN_VERSION,
                  });
                });
              });
            });
            describe('should return error 404 if', () => {
              it('user not found', async () => {
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({ id: 1 }));
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm/resend')
                  .set('authorization', 'Bearer token');
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
  });
});
