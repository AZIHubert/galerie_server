import { hash } from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import {
  createAccessToken,
} from '@src/helpers/auth';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const sequelize = initSequelize();

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
        it('should increment updatedEmailTokenVersion', async () => {
          const updatedEmail = 'user2@email.com';
          const password = 'Aaoudjiuvhds9!';
          const hashPassword = await hash(password, saltRounds);
          const { id, updatedEmailTokenVersion } = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: hashPassword,
            admin: false,
            confirmed: true,
            updatedEmailTokenVersion: 0,
          });
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({
              id,
            }))
            .mockImplementationOnce(() => ({
              id,
              updatedEmailTokenVersion: 0,
              updatedEmail,
            }));
          await request(initApp())
            .put('/users/me/updateEmail')
            .set('authorization', 'Bearer token')
            .set('confirmation', 'Bearer token')
            .send({ password });
          const updatedUser = await User.findByPk(id);
          expect(updatedUser!.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
        });
        it('should update user email', async () => {
          const updatedEmail = 'user2@email.com';
          const password = 'Aaoudjiuvhds9!';
          const hashPassword = await hash(password, saltRounds);
          const user = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: hashPassword,
            admin: false,
            confirmed: true,
            updatedEmailTokenVersion: 0,
          });
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({
              id: user.id,
            }))
            .mockImplementationOnce(() => ({
              id: user.id,
              updatedEmailTokenVersion: 0,
              updatedEmail,
            }));
          const { body, headers, status } = await request(initApp())
            .put('/users/me/updateEmail')
            .set('authorization', 'Bearer token')
            .set('confirmation', 'Bearer token')
            .send({ password });
          const updatedUser = await User.findByPk(user.id, { raw: true });
          expect(status).toBe(200);
          expect(updatedUser!.email).toBe(updatedEmail);
          expect(updatedUser!.authTokenVersion).toBe(user!.authTokenVersion + 1);
          expect(body).toHaveProperty('accessToken');
          expect(headers).toHaveProperty('set-cookie');
        });
        describe('should return error 401 if', () => {
          it('not logged in', async () => {
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'not authenticated',
            });
          });
          it('not confirmed', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              admin: false,
              confirmed: false,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'You\'re account need to be confimed',
            });
          });
          it('confirm id is not the same as current user id', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              admin: false,
              confirmed: true,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
              }))
              .mockImplementationOnce(() => ({
                id: 10000,
              }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'wrong user id',
            });
          });
          it('updatedEmailTokenVersion is not the same as current user updatedEmailTokenVersion', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              admin: false,
              confirmed: true,
              updatedEmailTokenVersion: 1,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
              }))
              .mockImplementationOnce(() => ({
                id: user.id,
                updatedEmailTokenVersion: 0,
              }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'incorrect token version',
            });
          });
          it('if updatedEmail is not found in token', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              admin: false,
              confirmed: true,
              updatedEmailTokenVersion: 0,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
              }))
              .mockImplementationOnce(() => ({
                id: user.id,
                updatedEmailTokenVersion: 0,
              }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'updated email not found',
            });
          });
          it('if password is not send', async () => {
            const hashPassword = await hash('Aoudjiuvhds9!', saltRounds);
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: hashPassword,
              admin: false,
              confirmed: true,
              updatedEmailTokenVersion: 0,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
              }))
              .mockImplementationOnce(() => ({
                id: user.id,
                updatedEmailTokenVersion: 0,
                updatedEmail: 'user2@email.com',
              }));
            const { body, status } = await request(initApp())
              .put('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .set('confirmation', 'Bearer token')
              .send({
                password: 'Aaoudiujbh09!',
              });
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: {
                password: 'wrong password',
              },
            });
          });
          it('if passwords not match', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              admin: false,
              confirmed: true,
              updatedEmailTokenVersion: 0,
            });
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: user.id,
              }))
              .mockImplementationOnce(() => ({
                id: user.id,
                updatedEmailTokenVersion: 0,
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
                password: 'is required',
              },
            });
          });
          describe('confirmation token is not', () => {
            let token: string;
            beforeEach(async (done) => {
              try {
                const user = await User.create({
                  userName: 'user',
                  email: 'user@email.com',
                  password: 'password',
                  admin: false,
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
                errors: 'confirmation token not found',
              });
            });
            it('\'Bearer ...\'', async () => {
              const { body, status } = await request(initApp())
                .put('/users/me/updateEmail')
                .set('authorization', `Bearer ${token}`)
                .set('confirmation', 'token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: 'wrong token',
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
                  userName: 'user',
                  email: 'user@email.com',
                  password: 'password',
                  admin: false,
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
