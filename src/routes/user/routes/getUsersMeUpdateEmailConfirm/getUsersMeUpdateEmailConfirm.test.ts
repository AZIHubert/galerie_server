import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import initSequelize from '@src/helpers/initSequelize.js';
import { createAccessToken } from '@src/helpers/auth';
import * as email from '@src/helpers/email';
import initApp from '@src/server';

const sequelize = initSequelize();

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
          it('should send an email and sign a token', async () => {
            const signMocked = jest.spyOn(jwt, 'sign');
            const emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
            const { id, emailTokenVersion } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'Aaoudjiuvhds9!',
              confirmed: true,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementation(() => ({
                id,
                emailTokenVersion,
              }));
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
          describe('should return 400 if email', () => {
            let user: User;
            beforeEach(async (done) => {
              try {
                user = await User.create({
                  userName: 'user',
                  email: 'user@email.com',
                  password: 'Aaoudjiuvhds9!',
                  confirmed: true,
                  admin: false,
                  authTokenVersion: 0,
                  emailTokenVersion: 0,
                });
              } catch (err) {
                done(err);
              }
              jest.spyOn(jwt, 'verify')
                .mockImplementation(() => ({
                  id: user.id,
                  emailTokenVersion: user.emailTokenVersion,
                }));
              done();
            });
            it('is empty', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer authToken')
                .set('confirmation', 'Bearer confirmToken')
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: 'is required',
                },
              });
            });
            it('is an empty string', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer authToken')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: '',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: 'cannot be an empty field',
                },
              });
            });
            it('is not a string', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer authToken')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 12345678,
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: 'should be a type of \'text\'',
                },
              });
            });
            it('is not an email', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer authToken')
                .set('confirmation', 'Bearer confirmToken')
                .send({
                  email: 'hello world',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  email: 'should be a valid email',
                },
              });
            });
            it('is the same than the old one', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail/confirm')
                .set('authorization', 'Bearer authToken')
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
              let accessToken: string;
              let user: User;
              beforeEach(async (done) => {
                try {
                  user = await User.create({
                    userName: 'user',
                    email: 'user@email.com',
                    password: 'Aaoudjiuvhds9!',
                    confirmed: false,
                    admin: false,
                    authTokenVersion: 1,
                  });
                  accessToken = createAccessToken(user);
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
                  errors: 'not authenticated',
                });
              });
              it('not confirmed', async () => {
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', `Bearer ${accessToken}`);
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: 'You\'re account need to be confimed',
                });
              });
            });
            describe('confirmation token', () => {
              let accessToken: string;
              let user: User;
              beforeEach(async (done) => {
                try {
                  user = await User.create({
                    userName: 'user',
                    email: 'user@email.com',
                    password: 'Aaoudjiuvhds9!',
                    confirmed: true,
                    admin: false,
                    emailTokenVersion: 1,
                  });
                  accessToken = createAccessToken(user);
                } catch (err) {
                  done(err);
                }
                done();
              });
              it('not found', async () => {
                const { status, body } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', `Bearer ${accessToken}`);
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: 'confirmation token not found',
                });
              });
              it('is not \'Bearer ...\'', async () => {
                const { status, body } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', `Bearer ${accessToken}`)
                  .set('confirmation', 'token');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: 'wrong token',
                });
              });
              it('is not correct version', async () => {
                jest.spyOn(jwt, 'verify')
                  .mockImplementation(() => ({
                    id: user.id,
                    emailTokenVersion: 0,
                  }));
                const { status, body } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', `Bearer ${accessToken}`)
                  .set('confirmation', 'Bearer token');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: 'incorrect token version',
                });
              });
              it('id and user.id are not the same', async () => {
                jest.spyOn(jwt, 'verify')
                  .mockImplementationOnce(() => ({
                    id: user.id,
                  }))
                  .mockImplementationOnce(() => ({
                    id: 10000,
                    emailTokenVersion: 1,
                  }));
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/confirm')
                  .set('authorization', `Bearer ${accessToken}`)
                  .set('confirmation', 'Bearer token');
                expect(body).toStrictEqual({
                  errors: 'token id are not the same as your current id',
                });
                expect(status).toBe(401);
              });
            });
          });
          describe('should return error 404 if', () => {
            it('user not found', async () => {
              jest.spyOn(jwt, 'verify')
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
                errors: 'user not found',
              });
            });
          });
          describe('should return error 500 if', () => {
            it('token is expired', async () => {
              const user = await User.create({
                userName: 'user',
                email: 'user@email.com',
                password: 'Aaoudjiuvhds9!',
                confirmed: true,
                admin: false,
                authTokenVersion: 0,
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
                admin: false,
                authTokenVersion: 0,
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
              const { id, emailTokenVersion } = await User.create({
                userName: 'user',
                email: 'user@email.com',
                password: 'Aaoudjiuvhds9!',
                confirmed: true,
                admin: false,
                authTokenVersion: 0,
              });
              jest.spyOn(jwt, 'verify')
                .mockImplementation(() => ({
                  id,
                  emailTokenVersion,
                }));
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
