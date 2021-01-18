import { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import {
  createAccessToken,
} from '@src/helpers/auth';
import {
  FIELD_IS_REQUIRED,
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const sequelize = initSequelize();

const newUSer = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

const INVALIDE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1cGRhdGVkRW1haWwiOiJ1c2VyMkBlbWFpbC5jb20iLCJ1cGRhdGVkRW1haWxUb2tlblZlcnNpb24iOjB9.5_-8zBH7pj6yrAIlGbZIm1GNXmR-jskVfL-1U3B_QcU';
const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1cGRhdGVkRW1haWwiOiJ1c2VyMkBlbWFpbC5jb20iLCJ1cGRhdGVkRW1haWxUb2tlblZlcnNpb24iOjAsImV4cCI6MH0.hQS9wpnUSS2Araz0tJ7xvTEJ4LaS1F5gBkPC1MpITQs';

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

  describe('me', () => {
    describe('updateEmail', () => {
      describe('put', () => {
        describe('should return status 200', () => {
          let user: User;
          let response: request.Response;
          const updatedEmail = 'user2@email.com';
          let updatedEmailTokenVersion: number;
          beforeEach(async (done) => {
            try {
              const password = 'Aaoudjiuvhds9!';
              const hashPassword = await hash(password, saltRounds);
              user = await User.create({
                ...newUSer,
                password: hashPassword,
                confirmed: true,
              });
              const { id, authTokenVersion } = user;
              updatedEmailTokenVersion = user.updatedEmailTokenVersion;
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id, authTokenVersion }))
                .mockImplementationOnce(() => ({ id, updatedEmailTokenVersion, updatedEmail }));
              response = await request(initApp())
                .put('/users/me/updateEmail')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token')
                .send({ password });
              done();
            } catch (err) {
              done(err);
            }
          });
          it('should increment updatedEmailTokenVersion', async () => {
            const { status } = response;
            await user.reload();
            expect(status).toBe(200);
            expect(user!.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
          });
          it('should update user email', async () => {
            const { status } = response;
            await user.reload();
            expect(status).toBe(200);
            expect(user.email).toBe(updatedEmail);
            expect(user.authTokenVersion).toBe(updatedEmailTokenVersion + 1);
          });
          it('should send accessToken and set refresh cookie', async () => {
            const { body, headers, status } = response;
            expect(status).toBe(200);
            expect(body).toHaveProperty('accessToken');
            expect(headers).toHaveProperty('set-cookie');
          });
        });
        describe('should return error 401 if', () => {
          it('not logged in', async () => {
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_AUTHENTICATED,
            });
          });
          it('not confirmed', async () => {
            const user = await User.create(newUSer);
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_CONFIRMED,
            });
          });
          it('confirm id is not the same as current user id', async () => {
            const { id, authTokenVersion } = await User.create({
              ...newUSer,
              confirmed: true,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, authTokenVersion }))
              .mockImplementationOnce(() => ({ id: 10000 }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: WRONG_TOKEN_USER_ID,
            });
          });
          it('updatedEmailTokenVersion is not the same as current user updatedEmailTokenVersion', async () => {
            const { id, authTokenVersion } = await User.create({
              ...newUSer,
              confirmed: true,
              updatedEmailTokenVersion: 1,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, authTokenVersion }))
              .mockImplementationOnce(() => ({ id, updatedEmailTokenVersion: 0 }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: WRONG_TOKEN_VERSION,
            });
          });
          it('if updatedEmail is not found in token', async () => {
            const { authTokenVersion, id, updatedEmailTokenVersion } = await User.create({
              ...newUSer,
              confirmed: true,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, authTokenVersion }))
              .mockImplementationOnce(() => ({ id, updatedEmailTokenVersion }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'updated email not found',
            });
          });
          it('if passwords not match', async () => {
            const hashPassword = await hash('password', saltRounds);
            const { authTokenVersion, id, updatedEmailTokenVersion } = await User.create({
              ...newUSer,
              password: hashPassword,
              confirmed: true,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, authTokenVersion }))
              .mockImplementationOnce(() => ({
                id,
                updatedEmailTokenVersion,
                updatedEmail: 'user2@email.com',
              }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token')
              .send({
                password: 'wrongPassword',
              });
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: {
                password: WRONG_PASSWORD,
              },
            });
          });
          it('if password not send', async () => {
            const { authTokenVersion, id, updatedEmailTokenVersion } = await User.create({
              ...newUSer,
              confirmed: true,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, authTokenVersion }))
              .mockImplementationOnce(() => ({
                id,
                updatedEmailTokenVersion,
                updatedEmail: 'user2@email.com',
              }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token')
              .send({});
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
          describe('confirmation token is not', () => {
            let token: string;
            beforeEach(async (done) => {
              try {
                const user = await User.create({
                  ...newUSer,
                  confirmed: true,
                });
                token = createAccessToken(user);
              } catch (err) {
                done(err);
              }
              done();
            });
            it('set', async () => {
              const { body, status } = await request(initApp())
                .put('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: TOKEN_NOT_FOUND,
              });
            });
            it('\'Bearer ...\'', async () => {
              const { body, status } = await request(initApp())
                .put('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .set('confirmation', 'token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN,
              });
            });
          });
        });
        describe('should return error 500 if', () => {
          describe('confirmation token is', () => {
            let token: string;
            beforeEach(async (done) => {
              try {
                const user = await User.create({
                  ...newUSer,
                  confirmed: true,
                });
                token = createAccessToken(user);
              } catch (err) {
                done(err);
              }
              done();
            });
            it('not valid', async () => {
              const { body, status } = await request(initApp())
                .put('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .set('confirmation', `Bearer ${INVALIDE_TOKEN}`);
              expect(status).toBe(500);
              expect(body).toStrictEqual({
                message: 'invalid signature',
                name: 'JsonWebTokenError',
              });
            });
            it('expire', async () => {
              const { body, status } = await request(initApp())
                .put('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .set('confirmation', `Bearer ${EXPIRED_TOKEN}`);
              expect(status).toBe(500);
              expect(body.message).toBe('jwt expired');
              expect(body.name).toBe('TokenExpiredError');
            });
          });
        });
      });
    });
  });
});
