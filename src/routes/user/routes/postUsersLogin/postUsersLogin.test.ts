import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { createAccessToken } from '@src/helpers/auth';
import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  NOT_CONFIRMED,
  USER_IS_LOGGED_IN,
  USER_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

interface AccessTokenI {
  id: string;
  uat: number;
  exp: string;
}

const sequelize = initSequelize();

const ACCES_SECRET = accEnv('ACCES_SECRET');

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
    jest.resetAllMocks();
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
      describe('should return 200', () => {
        let id: string;
        beforeEach(async (done) => {
          const { password } = newUser;
          const hashPassword = await bcrypt.hash(password, saltRounds);
          const { id: userId } = await User.create({
            ...newUser,
            password: hashPassword,
            confirmed: true,
          });
          id = userId;
          done();
        });
        it('and returning an accessToken', async () => {
          const { body, status } = await request(initApp())
            .get('/users/login')
            .send({
              userNameOrEmail: newUser.userName,
              password: newUser.password,
            });
          expect(status).toBe(200);
          expect(body).toHaveProperty('accessToken');
          const token = jwt.verify(body.accessToken, ACCES_SECRET) as AccessTokenI;
          expect(token.id).toBe(id);
        });
        it('and set a cookie', async () => {
          const { headers, status } = await request(initApp())
            .get('/users/login')
            .send({
              userNameOrEmail: newUser.userName,
              password: newUser.password,
            });
          expect(status).toBe(200);
          expect(headers).toHaveProperty('set-cookie');
        });
      });
      describe('should return error 400', () => {
        describe('if username or email', () => {
          it('is empty', async () => {
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                userNameOrEmail: '',
                password: 'password',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: FIELD_IS_EMPTY,
              },
            });
          });
          it('is not a string', async () => {
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                userNameOrEmail: 123456789,
                password: 'Aaoudjiuvhds9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: FIELD_NOT_A_STRING,
              },
            });
          });
          it('is not send', async () => {
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                password: 'Aaoudjiuvhds9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                userNameOrEmail: FIELD_IS_REQUIRED,
              },
            });
          });
        });
        describe('if password', () => {
          it('is empty', async () => {
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                userNameOrEmail: 'user',
                password: '',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_EMPTY,
              },
            });
          });
          it('is not a string', async () => {
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                userNameOrEmail: 'user',
                password: 123456789,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_NOT_A_STRING,
              },
            });
          });
          it('is not send', async () => {
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                userNameOrEmail: 'user',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
          it('not match', async () => {
            const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
            await User.create({
              ...newUser,
              password: hashPassword,
              confirmed: true,
            });
            const { body, status } = await request(initApp())
              .get('/users/login')
              .send({
                userNameOrEmail: newUser.email,
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
        it('is not confirmed', async () => {
          const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
          await User.create({
            ...newUser,
            password: hashPassword,
          });
          const { body, status } = await request(initApp())
            .get('/users/login')
            .send({
              userNameOrEmail: newUser.email,
              password: newUser.password,
            });
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
        it('is already logged in', async () => {
          const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
          const user = await User.create({
            ...newUser,
            password: hashPassword,
            confirmed: true,
          });
          const token = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/login')
            .send({
              emailOrPassword: newUser.email,
              password: newUser.password,
            })
            .set('authorization', `Bearer ${token}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: USER_IS_LOGGED_IN,
          });
        });
      });
      describe('should return error 404 if', () => {
        it('should return error 404 if user not found', async () => {
          const { body, status } = await request(initApp())
            .get('/users/login')
            .send({
              userNameOrEmail: newUser.email,
              password: newUser.password,
            });
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: {
              userNameOrEmail: USER_NOT_FOUND,
            },
          });
        });
      });
    });
  });
});
