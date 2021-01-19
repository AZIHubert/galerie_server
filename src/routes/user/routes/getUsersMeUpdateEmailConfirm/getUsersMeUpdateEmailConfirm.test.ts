import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import initSequelize from '@src/helpers/initSequelize.js';
import { createAccessToken } from '@src/helpers/auth';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  TOKEN_NOT_FOUND,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initApp from '@src/server';

const sequelize = initSequelize();

const newUser = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

const EXPIRE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbFRva2VuVmVyc2lvbiI6MCwiZXhwIjowfQ.tKA9JH07dCp-00jxcJ8Cb3sRMzUY92aPmj_X5ha-ZEc';

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
      describe('confirm', () => {
        describe('GET', () => {
          describe('should return status 200 and', () => {
            let user: User;
            beforeEach(async (done) => {
              try {
                user = await User.create({
                  ...newUser,
                  confirmed: true,
                });
                const { id, emailTokenVersion, authTokenVersion } = user;
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({ id, authTokenVersion }))
                  .mockImplementationOnce(() => ({ id, emailTokenVersion }));
                done();
              } catch (err) {
                done(err);
              }
            });
            it('should increment emailTokenVersion', async () => {
              await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token')
                .send({
                  email: 'user2@email.com',
                });
              const updatedUser = await User.findByPk(user.id);
              expect(updatedUser?.emailTokenVersion).toBe(user.emailTokenVersion + 1);
            });
            it('send an email and sign a token', async () => {
              const signMocked = jest.spyOn(jwt, 'sign');
              const emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token')
                .send({
                  email: 'user2@email.com',
                });
              expect(status).toBe(204);
              expect(signMocked).toHaveBeenCalledTimes(1);
              expect(emailMocked).toHaveBeenCalledTimes(1);
            });
          });
          describe('should return 400 if email', () => {
            let token: string;
            beforeEach(async (done) => {
              try {
                const { authTokenVersion, id, emailTokenVersion } = await User.create({
                  ...newUser,
                  confirmed: true,
                });
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({ id, authTokenVersion }))
                  .mockImplementationOnce(() => ({ id, emailTokenVersion }));
                done();
              } catch (err) {
                done(err);
              }
            });
            it('is empty', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer confirmToken')
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_IS_REQUIRED,
                },
              });
            });
            it('is an empty string', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer confirmToken')
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
            it('is not a string', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', `Bearer ${token}`)
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 12345678,
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_NOT_A_STRING,
                },
              });
            });
            it('is not an email', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 'hello world',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: FIELD_IS_EMAIL,
                },
              });
            });
            it('is the same than the old one', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 'user@email.com',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: 'should be a different one',
                },
              });
            });
          });
          describe('should return 401 if', () => {
            describe('user', () => {
              beforeEach(async (done) => {
                try {
                  const { authTokenVersion, id, emailTokenVersion } = await User.create({
                    ...newUser,
                  });
                  jest.spyOn(jwt, 'verify')
                    .mockImplementationOnce(() => ({ id, authTokenVersion }))
                    .mockImplementationOnce(() => ({ id, emailTokenVersion }));
                } catch (err) {
                  done(err);
                }
                done();
              });
              it('not logged in', async () => {
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: NOT_AUTHENTICATED,
                });
              });
              it('not confirmed', async () => {
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', 'Bearer token');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: NOT_CONFIRMED,
                });
              });
            });
            describe('confirmation token', () => {
              let user: User;
              beforeEach(async (done) => {
                try {
                  user = await User.create({
                    ...newUser,
                    confirmed: true,
                    emailTokenVersion: 1,
                  });
                  const { authTokenVersion, id } = user;
                  jest.spyOn(jwt, 'verify')
                    .mockImplementationOnce(() => ({ id, authTokenVersion }))
                    .mockImplementationOnce(() => ({ id, emailTokenVersion: 0 }));
                } catch (err) {
                  done(err);
                }
                done();
              });
              it('not found', async () => {
                const { status, body } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', 'Bearer token');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: TOKEN_NOT_FOUND,
                });
              });
              it('is not \'Bearer ...\'', async () => {
                const { status, body } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', 'Bearer token')
                  .set('confirmation', 'token');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: WRONG_TOKEN,
                });
              });
              it('is not correct version', async () => {
                const { status, body } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', 'Bearer token')
                  .set('confirmation', 'Bearer token');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: WRONG_TOKEN_VERSION,
                });
              });
              it('id and user.id are not the same', async () => {
                const { authTokenVersion, id, emailTokenVersion } = user;
                jest.resetAllMocks();
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({ id, authTokenVersion }))
                  .mockImplementationOnce(() => ({
                    id: 10000,
                    emailTokenVersion,
                  }));
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', 'Bearer token')
                  .set('confirmation', 'Bearer token');
                expect(body).toStrictEqual({
                  errors: WRONG_TOKEN_USER_ID,
                });
                expect(status).toBe(401);
              });
            });
          });
          describe('should return error 404 if', () => {
            it('user not found', async () => {
              jest.spyOn(jwt, 'verify')
                .mockImplementation(() => ({ id: 1 }))
                .mockImplementation(() => ({
                  id: 1,
                  emailTokenVersion: 0,
                }));
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token');
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
          });
          describe('should return error 500 if', () => {
            it('token is expired', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const accessToken = createAccessToken(user);
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', `Bearer ${accessToken}`)
                .set('confirmation', `Bearer ${EXPIRE_TOKEN}`);
              expect(status).toBe(500);
            });
            it('user finfByPk fail', async () => {
              jest.spyOn(User, 'findByPk')
                .mockImplementation(() => {
                  throw new Error('err');
                });
              jest.spyOn(jwt, 'verify')
                .mockImplementation(() => ({
                  id: 1,
                  emailTokenVersion: 0,
                }));
              await User.create({
                userName: 'user',
                email: 'user@email.com',
                password: 'Aaoudjiuvhds9!',
                confirmed: true,
              });
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token')
                .send({
                  email: 'user2@email.com',
                });
              expect(status).toBe(500);
            });
            it('jwt sign fail', async () => {
              jest.spyOn(jwt, 'sign')
                .mockImplementation(() => {
                  throw new Error('something went wrong');
                });
              const { authTokenVersion, id, emailTokenVersion } = await User.create({
                ...newUser,
                confirmed: true,
              });
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id, authTokenVersion }))
                .mockImplementation(() => ({ id, emailTokenVersion }));
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer token')
                .set('confirmation', 'Bearer token')
                .send({
                  email: 'user2@email.com',
                });
              expect(status).toBe(500);
            });
          });
        });
      });
    });
  });
});
