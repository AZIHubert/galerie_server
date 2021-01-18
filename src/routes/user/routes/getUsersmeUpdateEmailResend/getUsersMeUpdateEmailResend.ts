import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import { createAccessToken } from '@src/helpers/auth';
import * as email from '@src/helpers/email';
import {
  FIELD_IS_REQUIRED,
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
  email: 'user@email',
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
    describe('updateEmail', () => {
      describe('resend', () => {
        describe('GET', () => {
          describe('should return status 201 and', () => {
            const password = 'Aaoudjiuvhds9!';
            let token: string;
            let user: User;
            beforeEach(async (done) => {
              try {
                const hashPassword = await bcrypt.hash(password, saltRounds);
                user = await User.create({
                  ...newUser,
                  password: hashPassword,
                  confirmed: true,
                });
                token = createAccessToken(user);
                done();
              } catch (err) {
                done(err);
              }
            });
            it('increment emailTokenVersion', async () => {
              await request(initApp())
                .get('/users/me/updateEmail/resend')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password,
                });
              const updatedUser = await User.findByPk(user.id, { raw: true });
              expect(updatedUser!.emailTokenVersion).toBe(user.emailTokenVersion + 1);
            });
            it('sign a token and send an email', async () => {
              const emailMocked = jest.spyOn(email, 'sendUpdateEmailMessage');
              const signMocked = jest.spyOn(jwt, 'sign');
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/resend')
                .set('authorization', `Bearer ${token}`)
                .send({
                  password,
                });
              expect(status).toBe(201);
              expect(emailMocked).toHaveBeenCalledTimes(1);
              expect(signMocked).toHaveBeenCalledTimes(1);
            });
          });
          describe('return error 400 if', () => {
            it('password not send', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const authToken = createAccessToken(user);
              const { body, status } = await request(initApp())
                .get('/users/me/updateEmail/resend')
                .set('authorization', `Bearer ${authToken}`)
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: FIELD_IS_REQUIRED,
              });
            });
            it('passwords not match', async () => {
              const hashPassword = await bcrypt.hash('Aaoudjiuvhds9', saltRounds);
              const user = await User.create({
                ...newUser,
                password: hashPassword,
                confirmed: true,
              });
              const authToken = createAccessToken(user);
              const { body, status } = await request(initApp())
                .get('/users/me/updateEmail/resend')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                  password: 'password',
                });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: WRONG_PASSWORD,
              });
            });
          });
          describe('return error 401 if', () => {
            describe('user is not', () => {
              it('logged in', async () => {
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/resend');
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: NOT_AUTHENTICATED,
                });
              });
              it('confirmed', async () => {
                const user = await User.create(newUser);
                const authToken = createAccessToken(user);
                const { body, status } = await request(initApp())
                  .get('/users/me/updateEmail/resend')
                  .set('authorization', `Bearer ${authToken}`);
                expect(status).toBe(401);
                expect(body).toStrictEqual({
                  errors: NOT_CONFIRMED,
                });
              });
            });
          });
          describe('return error 404 if', () => {
            it('current user id is not found', async () => {
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({
                  id: 1,
                }));
              const { body, status } = await request(initApp())
                .get('/users/me/updateEmail/resend')
                .set('authorization', 'Bearer token');
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
          });
          describe('return error 500 if', () => {
            it('bcrypt failed to compare', async () => {
              const password = 'Aaoudjiuvhds9';
              jest.spyOn(bcrypt, 'compare')
                .mockImplementationOnce(() => {
                  throw new Error();
                });
              const hashPassword = await bcrypt.hash(password, saltRounds);
              const user = await User.create({
                ...newUser,
                password: hashPassword,
                confirmed: true,
              });
              const authToken = createAccessToken(user);
              const { status } = await request(initApp())
                .get('/users/me/updateEmail/resend')
                .set('authorization', `Bearer ${authToken}`)
                .send({
                  password,
                });
              expect(status).toBe(500);
            });
          });
        });
      });
    });
  });
});
