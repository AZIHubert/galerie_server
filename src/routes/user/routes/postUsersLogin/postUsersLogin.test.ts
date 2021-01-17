import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import {
  NOT_CONFIRMED,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

interface UserLoginI {
  userNameOrEmail?: string | number;
  password?: string | number;
}
interface AccessTokenI {
  id: string;
  uat: number;
  exp: string;
}

const sequelize = initSequelize();

const ACCES_SECRET = accEnv('ACCES_SECRET');

const sendLoginRequest = async (user: UserLoginI) => request(initApp()).get('/users/login').send(user);

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
  describe('login', () => {
    describe('GET', () => {
      it('should return error 404 if user not found', async () => {
        const { body, status } = await sendLoginRequest({
          userNameOrEmail: 'user',
          password: 'Aaoudjiuvhds9!',
        });
        expect(status).toBe(404);
        expect(body).toStrictEqual({
          errors: {
            userNameOrEmail: 'user not found',
          },
        });
      });
      describe('should return 200', () => {
        let bcrytMock: jest.SpyInstance;
        let id: string;
        beforeEach(async (done) => {
          try {
            await User.sync({ force: true });
          } catch (err) {
            done(err);
          }
          bcrytMock = jest.spyOn(bcrypt, 'compare');
          bcrytMock.mockImplementationOnce((): Promise<any> => Promise.resolve(true));
          const { id: userId } = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: 'Aaoudjiuvhds9!',
            confirmed: true,
          });
          id = userId;
          done();
        });
        afterEach(() => {
          bcrytMock.mockRestore();
        });
        it('and returning an accessToken', async () => {
          const { body, status } = await sendLoginRequest({
            userNameOrEmail: 'user',
            password: 'Aaoudjiuvhds9!',
          });
          expect(status).toBe(200);
          expect(body).toHaveProperty('accessToken');
          const token = jwt.verify(body.accessToken, ACCES_SECRET) as AccessTokenI;
          expect(token.id).toBe(id);
        });
        it('and set a cookie', async () => {
          const { headers, status } = await sendLoginRequest({
            userNameOrEmail: 'user',
            password: 'Aaoudjiuvhds9!',
          });
          expect(status).toBe(200);
          expect(headers).toHaveProperty('set-cookie');
        });
      });
      describe('should return error 400', () => {
        describe('if username or email', () => {
          it('is empty', async () => {
            const { body, status } = await sendLoginRequest({
              userNameOrEmail: '',
              password: 'Aaoudjiuvhds9!',
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: 'cannot be an empty field',
              },
            });
          });
          it('is not a string', async () => {
            const { body, status } = await sendLoginRequest({
              userNameOrEmail: 123456789,
              password: 'Aaoudjiuvhds9!',
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: 'should be a type of \'text\'',
              },
            });
          });
          it('is not here', async () => {
            const { body, status } = await sendLoginRequest({
              password: 'Aaoudjiuvhds9!',
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: 'is required',
              },
            });
          });
        });
        describe('if password', () => {
          it('is empty', async () => {
            const { body, status } = await sendLoginRequest({
              userNameOrEmail: 'user',
              password: '',
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'cannot be an empty field',
              },
            });
          });
          it('is not a string', async () => {
            const { body, status } = await sendLoginRequest({
              userNameOrEmail: 'user',
              password: 123456789,
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'should be a type of \'text\'',
              },
            });
          });
          it('is not here', async () => {
            const { body, status } = await sendLoginRequest({
              userNameOrEmail: 'user',
            });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'is required',
              },
            });
          });
          it('not match', async () => {
            await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'Aaoudjiuvhds9!',
              confirmed: true,
            });
            const { body, status } = await sendLoginRequest({
              userNameOrEmail: 'user@email.com',
              password: 'Aaoudjiuvhds9',
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
        beforeEach(async (done) => {
          try {
            await User.sync({ force: true });
            await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'Aaoudjiuvhds9!',
              confirmed: false,
            });
          } catch (err) {
            done(err);
          }
          done();
        });
        it('is not confirmed', async () => {
          const { body, status } = await sendLoginRequest({
            userNameOrEmail: 'user',
            password: 'Aaoudjiuvhds9!',
          });
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
        it('is already logged in', async () => {
          const { body, status } = await request(initApp()).get('/users/login').send({
            emailOrPassword: 'user@email.com',
            password: 'Aaoudjiuvhds9!',
          }).set('authorization', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'you are already authenticated',
          });
        });
      });
    });
  });
});
