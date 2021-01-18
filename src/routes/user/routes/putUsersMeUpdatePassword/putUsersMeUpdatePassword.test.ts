import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as auth from '@src/helpers/auth';
import {
  FIELD_IS_EMPTY,
  FIELD_IS_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_NOT_A_STRING,
  FIELD_IS_CONFIRM_PASSWORD,
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
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
    describe('updatePassword', () => {
      describe('should return status 200 and', () => {
        const updatedPassword = 'Aaoudjiuvhds9!';
        let user: User;
        let hashMocked: jest.SpyInstance;
        let createAccessTokenMocked: jest.SpyInstance;
        let sendRefreshTokenMocked: jest.SpyInstance;
        let createRefreshTokenMocked: jest.SpyInstance;
        let response: request.Response;
        beforeEach(async (done) => {
          try {
            const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
            user = await User.create({
              ...newUser,
              password: hashPassword,
              confirmed: true,
            });
            const token = auth.createAccessToken(user);
            createAccessTokenMocked = jest.spyOn(auth, 'createAccessToken');
            sendRefreshTokenMocked = jest.spyOn(auth, 'sendRefreshToken');
            createRefreshTokenMocked = jest.spyOn(auth, 'createRefreshToken');
            hashMocked = jest.spyOn(bcrypt, 'hash');
            response = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            done();
          } catch (err) {
            done(err);
          }
        });
        it('should hash password', async () => {
          const { status } = response;
          expect(status).toBe(200);
          expect(hashMocked).toHaveBeenCalledTimes(1);
          expect(hashMocked).toHaveBeenCalledWith(updatedPassword, saltRounds);
        });
        it('should update user password', async () => {
          const { password } = await user.reload();
          const { status } = response;
          const updatedPasswordsMatch = await bcrypt.compare(updatedPassword, password);
          expect(status).toBe(200);
          expect(updatedPasswordsMatch).toBe(true);
        });
        it('should increment authTokenVersion', async () => {
          const { authTokenVersion } = user;
          const { authTokenVersion: updatedAuthTokenVersion } = await user.reload();
          const { status } = response;
          expect(status).toBe(200);
          expect(updatedAuthTokenVersion).toBe(authTokenVersion + 1);
        });
        it('should return accessToken', async () => {
          const { body, status } = response;
          expect(status).toBe(200);
          expect(createAccessTokenMocked).toHaveBeenCalledTimes(1);
          expect(body).toHaveProperty('accessToken');
        });
        it('should set cookie refreshToken', async () => {
          const { headers, status } = response;
          expect(status).toBe(200);
          expect(sendRefreshTokenMocked).toHaveBeenCalledTimes(1);
          expect(createRefreshTokenMocked).toHaveBeenCalledTimes(1);
          expect(headers).toHaveProperty('set-cookie');
        });
      });
      describe('should return error 400 if', () => {
        let token: string;
        const password = 'password';
        beforeEach(async (done) => {
          let user: User;
          try {
            const hashPassword = await bcrypt.hash(password, saltRounds);
            user = await User.create({
              ...newUser,
              password: hashPassword,
              confirmed: true,
            });
            token = auth.createAccessToken(user);
          } catch (err) {
            done(err);
          }
          done();
        });
        describe('password', () => {
          it('is not sent', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({});
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is empty', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
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
        });
        describe('updatedPassword', () => {
          it('is not send', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is not a string', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 12345,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_NOT_A_STRING,
              },
            });
          });
          it('is empty', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: '',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_EMPTY,
              },
            });
          });
          it('is less than 8 characters', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'Aa8!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_MIN_LENGTH_OF_HEIGH,
              },
            });
          });
          it('is more than 30 characters', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: `Ac9!${'a'.repeat(31)}`,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_MAX_LENGTH_THRITY,
              },
            });
          });
          it('does not contain lowercase', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'aaoudjiuvhds9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
          it('does not contain uppercase', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'AAOUDJIUVHDS9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
          it('does not contain number', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'AAOUDJIUVHDS!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
          it('does not contain special char', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'AAOUDJIUVHDS9',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
        });
        describe('confirmUpdatedPassword', () => {
          it('is not set', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'Aaoudjiuvhds0!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                confirmUpdatedPassword: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is not the same than updatedPassword', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password,
                updatedPassword: 'Aaoudjiuvhds0!',
                confirmUpdatedPassword: 'wrongConfirmPassword',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                confirmUpdatedPassword: FIELD_IS_CONFIRM_PASSWORD,
              },
            });
          });
        });
        describe('passwords', () => {
          it('not match', async () => {
            const updatedPasswords = 'Aaoudjiuvhds9!';
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${token}`)
              .send({
                password: 'wrongPassword',
                updatedPassword: updatedPasswords,
                confirmUpdatedPassword: updatedPasswords,
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
            .put('/users/me/updatePassword');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_AUTHENTICATED,
          });
        });
        it('auth token not \'Bearer token\'', async () => {
          const { status, body } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', 'token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: WRONG_TOKEN,
          });
        });
        it('not confirmed', async () => {
          const user = await User.create(newUser);
          const accessToken = auth.createAccessToken(user);
          const { status, body } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
      });
      describe('should return error 404 if', () => {
        it('user not found', async () => {
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({
              id: 0,
            }));
          const { status, body } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', 'Bearer token');
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: USER_NOT_FOUND,
          });
        });
      });
      describe('should return error 500 if', () => {
        it('auth token isn\'t valid', async () => {
          const { status, body } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', 'Bearer token');
          expect(status).toBe(500);
          expect(body.message).toBe('jwt malformed');
        });
        it('bcrypt fail to compare passwords', async () => {
          const updatedPasswords = 'Aaoudjiuvhds9!';
          jest.spyOn(bcrypt, 'compare')
            .mockImplementationOnce(() => {
              throw new Error('something went wrong');
            });
          const user = await User.create({
            ...newUser,
            confirmed: true,
          });
          const accessToken = auth.createAccessToken(user);
          const { status } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', `Bearer ${accessToken}`)
            .send({
              password: 'password',
              updatedPassword: updatedPasswords,
              confirmUpdatedPassword: updatedPasswords,
            });
          expect(status).toBe(500);
        });
        it('bcrypt fail to hash updated password', async () => {
          const updatedPasswords = 'Aaoudjiuvhds9!';
          jest.spyOn(bcrypt, 'hash')
            .mockImplementationOnce(() => {
              throw new Error('something went wrong');
            });
          jest.spyOn(bcrypt, 'compare')
            .mockImplementationOnce(() => Promise.resolve(true));
          const user = await User.create({
            ...newUser,
            confirmed: true,
          });
          const accessToken = auth.createAccessToken(user);
          const { status } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', `Bearer ${accessToken}`)
            .send({
              password: 'password',
              updatedPassword: updatedPasswords,
              confirmUpdatedPassword: updatedPasswords,
            });
          expect(status).toBe(500);
        });
      });
    });
  });
});
