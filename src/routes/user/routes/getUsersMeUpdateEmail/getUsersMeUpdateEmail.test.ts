import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import { createAccessToken } from '@src/helpers/auth';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const sequelize = initSequelize();

const newUser = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  const jwtMocked = jest.spyOn(jwt, 'verify');
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
    done();
  });
  describe('me', () => {
    describe('updateEmail', () => {
      describe('GET', () => {
        describe('should return status 200 and', () => {
          it('create a token and send an email', async (done) => {
            try {
              const hashedPassword = await bcrypt.hash('Aaoudjiuvhds9!', saltRounds);
              const newUserWithHasedPasswordAndConfirmed = {
                ...newUser,
                password: hashedPassword,
                confirmed: true,
              };
              const user = await User.create(newUserWithHasedPasswordAndConfirmed);
              const token = createAccessToken(user);
              const emailMock = jest.spyOn(email, 'sendUpdateEmailMessage');
              const signMock = jest.spyOn(jwt, 'sign');
              const { status } = await request(initApp())
                .get('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password: 'Aaoudjiuvhds9!',
                });
              expect(status).toBe(201);
              expect(emailMock).toHaveBeenCalledTimes(1);
              expect(signMock).toHaveBeenCalledTimes(1);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
        describe('should return error 400 if', () => {
          let token: string;
          beforeEach(async (done) => {
            try {
              const newUserWithConfirmed = {
                ...newUser,
                confirmed: true,
              };
              const user = await User.create(newUserWithConfirmed);
              token = createAccessToken(user);
            } catch (err) {
              done(err);
            }
            done();
          });
          describe('password', () => {
            it('is not set', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: FIELD_IS_REQUIRED,
                },
              });
            });
            it('is not a string', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password: 123456,
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: FIELD_NOT_A_STRING,
                },
              });
            });
            it('is empty', async () => {
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password: '',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: FIELD_IS_EMPTY,
                },
              });
            });
            it('not match user password', async () => {
              jest.spyOn(bcrypt, 'compare')
                .mockImplementationOnce(() => Promise.resolve(false));
              const { status, body } = await request(initApp())
                .get('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password: 'wrongPassword',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  password: WRONG_PASSWORD,
                },
              });
            });
          });
        });
        describe('should return error 401 if', () => {
          it('not logged in', async () => {
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_AUTHENTICATED,
            });
          });
          it('confirmed', async () => {
            const user = await User.create(newUser);
            const token = createAccessToken(user);
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_CONFIRMED,
            });
          });
        });
        describe('should return error 404 if', () => {
          it('user not found', async () => {
            jwtMocked.mockImplementationOnce(() => ({
              id: 1,
            }));
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', 'Bearer token');
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
        });
        describe('should return error 500 if', () => {
          it('compare password fail', async (done) => {
            try {
              const hashedPassword = await bcrypt.hash('Aaoudjiuvhds9!', saltRounds);
              const newUserWithHasedPasswordAndConfirmed = {
                ...newUser,
                password: hashedPassword,
                confirmed: true,
              };
              const user = await User.create(newUserWithHasedPasswordAndConfirmed);
              const token = createAccessToken(user);
              const compareMocked = jest.spyOn(bcrypt, 'compare')
                .mockImplementationOnce(() => {
                  throw new Error('something went wrong');
                });
              const { status } = await request(initApp())
                .get('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password: 'Aaoudjiuvhds9!',
                });
              expect(compareMocked).toHaveBeenCalledTimes(1);
              expect(status).toBe(500);
              done();
            } catch (err) {
              done(err);
            }
          });
        });
      });
    });
  });
});
