import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import * as auth from '@src/helpers/auth';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';
import User from '@src/db/models/user';

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
        let updatedPasswords: string;
        let user: User;
        let hashMocked: jest.SpyInstance;
        let createAccessTokenMocked: jest.SpyInstance;
        let sendRefreshTokenMocked: jest.SpyInstance;
        let createRefreshTokenMocked: jest.SpyInstance;
        let body: any;
        let status: number;
        let headers: any;
        beforeEach(async (done) => {
          try {
            updatedPasswords = 'Aaoudjiuvhds9!';
            const password = 'Aaoudjiuvhds9!';
            const hashPassword = await bcrypt.hash(password, saltRounds);
            user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: hashPassword,
              confirmed: true,
            });
            const accessToken = auth.createAccessToken(user);
            createAccessTokenMocked = jest.spyOn(auth, 'createAccessToken');
            sendRefreshTokenMocked = jest.spyOn(auth, 'sendRefreshToken');
            createRefreshTokenMocked = jest.spyOn(auth, 'createRefreshToken');
            hashMocked = jest.spyOn(bcrypt, 'hash');
            const response = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: updatedPasswords,
                confirmUpdatedPassword: updatedPasswords,
              });
            headers = response.headers;
            body = response.body;
            status = response.status;
          } catch (err) {
            done(err);
          }
          done();
        });
        it('should hash password', async () => {
          expect(status).toBe(200);
          expect(hashMocked).toHaveBeenCalledTimes(1);
          expect(hashMocked).toHaveBeenCalledWith(updatedPasswords, saltRounds);
        });
        it('should update user password', async () => {
          const updatedUser = await User.findByPk(user.id, { raw: true });
          const updatedPassword = await bcrypt.compare(updatedPasswords, updatedUser!.password);
          expect(status).toBe(200);
          expect(updatedPassword).toBe(true);
        });
        it('should increment authTokenVersion', async () => {
          const updatedUser = await User.findByPk(user.id, { raw: true });
          expect(status).toBe(200);
          expect(updatedUser!.authTokenVersion).toBe(user.authTokenVersion + 1);
        });
        it('should return accessToken', async () => {
          expect(status).toBe(200);
          expect(createAccessTokenMocked).toHaveBeenCalledTimes(1);
          expect(body).toHaveProperty('accessToken');
        });
        it('should set cookie refreshToken', async () => {
          expect(status).toBe(200);
          expect(sendRefreshTokenMocked).toHaveBeenCalledTimes(1);
          expect(createRefreshTokenMocked).toHaveBeenCalledTimes(1);
          expect(headers).toHaveProperty('set-cookie');
        });
      });
      describe('should return error 400 if', () => {
        let accessToken: string;
        const password = 'password';
        beforeEach(async (done) => {
          let user: User;
          try {
            const hashPassword = await bcrypt.hash(password, saltRounds);
            user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: hashPassword,
              confirmed: true,
            });
            accessToken = auth.createAccessToken(user);
          } catch (err) {
            done(err);
          }
          done();
        });
        describe('password', () => {
          it('is not sent', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({});
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'is required',
              },
            });
          });
          it('is empty', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password: '',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'cannot be an empty field',
              },
            });
          });
        });
        describe('updatedPassword', () => {
          it('is not send', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'is required',
              },
            });
          });
          it('is not a string', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 12345,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'should be a type of \'text\'',
              },
            });
          });
          it('is empty', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: '',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'cannot be an empty field',
              },
            });
          });
          it('is less than 8 characters', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'Aa8!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'should have a minimum length of 8',
              },
            });
          });
          it('is more than 30 characters', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: `Ac9!${'a'.repeat(31)}`,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'should have a maximum length of 30',
              },
            });
          });
          it('does not contain lowercase', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'aaoudjiuvhds9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
          it('does not contain uppercase', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'AAOUDJIUVHDS9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
          it('does not contain number', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'AAOUDJIUVHDS!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
          it('does not contain special char', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'AAOUDJIUVHDS9',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
        });
        describe('confirmUpdatedPassword', () => {
          it('is not set', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'Aaoudjiuvhds0!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                confirmUpdatedPassword: 'is required',
              },
            });
          });
          it('is not the same than updatedPassword', async () => {
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password,
                updatedPassword: 'Aaoudjiuvhds0!',
                confirmUpdatedPassword: 'wrongConfirmPassword',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                confirmUpdatedPassword: 'must match updated password',
              },
            });
          });
        });
        describe('passwords', () => {
          it('not match', async () => {
            const updatedPasswords = 'Aaoudjiuvhds9!';
            const { status, body } = await request(initApp())
              .put('/users/me/updatePassword')
              .set('authorization', `Bearer ${accessToken}`)
              .send({
                password: 'wrongPassword',
                updatedPassword: updatedPasswords,
                confirmUpdatedPassword: updatedPasswords,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'wrong password',
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
            errors: 'not authenticated',
          });
        });
        it('auth token not \'Bearer token\'', async () => {
          const { status, body } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', 'token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'wrong token',
          });
        });
        it('not confirmed', async () => {
          const user = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: 'password',
          });
          const accessToken = auth.createAccessToken(user);
          const { status, body } = await request(initApp())
            .put('/users/me/updatePassword')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'You\'re account need to be confimed',
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
            errors: 'user not found',
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
            userName: 'user',
            email: 'user@email.com',
            password: 'password',
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
            userName: 'user',
            email: 'user@email.com',
            password: 'password',
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
