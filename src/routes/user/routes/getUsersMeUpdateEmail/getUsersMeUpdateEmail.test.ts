import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import * as email from '@src/helpers/email';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const sequelize = initSequelize();

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
        it('should create a token and send an email', async () => {
          const emailMock = jest.spyOn(email, 'sendUpdateEmailMessage');
          const signMock = jest.spyOn(jwt, 'sign');
          try {
            const hashedPassword = await bcrypt.hash('Aaoudjiuvhds9!', saltRounds);
            const { id } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: hashedPassword,
              confirmed: true,
              admin: false,
              authTokenVersion: 0,
            });
            jwtMocked.mockImplementationOnce(() => ({
              id,
            }));
          } catch (err) {
            throw new Error(err);
          }
          const { status } = await request(initApp())
            .get('/users/me/updateEmail')
            .set('authorization', 'Bearer token')
            .send({
              password: 'Aaoudjiuvhds9!',
            });
          expect(status).toBe(201);
          expect(emailMock).toHaveBeenCalledTimes(1);
          expect(signMock).toHaveBeenCalledTimes(1);
        });
        it('should return error 404 if user not found', async () => {
          jwtMocked.mockImplementationOnce(() => ({
            id: 1,
          }));
          const { status, body } = await request(initApp())
            .get('/users/me/updateEmail')
            .set('authorization', 'Bearer 1234');
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: 'user not found',
          });
        });
        describe('should return error 400 if password', () => {
          beforeEach(async (done) => {
            try {
              const { id } = await User.create({
                userName: 'user',
                email: 'user@email.com',
                password: 'password',
                authTokenVersion: 0,
                confirmed: true,
                admin: false,
              });
              jwtMocked.mockImplementationOnce(() => ({
                id,
              }));
            } catch (err) {
              done(err);
            }
            done();
          });
          it('is not set', async () => {
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .send({});
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'is required',
              },
            });
          });
          it('is not a string', async () => {
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .send({
                password: 123456,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'should be a type of \'text\'',
              },
            });
          });
          it('is empty', async () => {
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
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
          it('not match user password', async () => {
            jest.spyOn(bcrypt, 'compare')
              .mockImplementationOnce(() => Promise.resolve(false));
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', 'Bearer token')
              .send({
                password: 'Aaoudjiuvhds9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'wrong password',
              },
            });
          });
        });
        describe('should return error 401 if not', () => {
          it('logged in', async () => {
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'not authenticated',
            });
          });
          it('confirmed', async () => {
            const { id } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              authTokenVersion: 0,
              confirmed: false,
              admin: false,
            });
            jwtMocked.mockImplementationOnce(() => ({
              id,
            }));
            const { status, body } = await request(initApp())
              .get('/users/me/updateEmail')
              .set('authorization', 'Bearer 1234');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'You\'re account need to be confimed',
            });
          });
        });
        it('should return error 500 if compare password fail', async () => {
          const hashedPassword = await bcrypt.hash('Aaoudjiuvhds9!', saltRounds);
          const { id } = await User.create({
            userName: 'userFailed',
            email: 'user@email.com',
            password: hashedPassword,
            confirmed: true,
            admin: false,
            authTokenVersion: 0,
          });
          jwtMocked.mockImplementation(() => ({
            id,
          }));
          const compareMocked = jest.spyOn(bcrypt, 'compare')
            .mockImplementationOnce(() => {
              throw new Error('something went wrong');
            });
          const { status } = await request(initApp())
            .get('/users/me/updateEmail')
            .set('authorization', 'Bearer token')
            .send({
              password: 'Aaoudjiuvhds9!',
            });
          expect(compareMocked).toHaveBeenCalledTimes(1);
          expect(status).toBe(500);
        });
      });
    });
  });
});
