import { Server } from 'http';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_NOT_A_STRING,
  TOKEN_NOT_FOUND,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
  FIELD_IS_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import * as verifyConfirmation from '@src/helpers/verifyConfirmation';
import initApp from '@src/server';

const clearDatas = async () => {
  await User.sync({ force: true });
};

const newUser = {
  userName: 'user',
  email: 'user@email',
  password: 'password',
};

describe('users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    try {
      await clearDatas();
      const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
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
      await clearDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('resetPassword', () => {
    describe('PUT', () => {
      describe('should return status 204', () => {
        const resetPassword = 'Aaoudjiuvhds9!';
        let response: request.Response;
        let bcryptMock: jest.SpyInstance;
        beforeEach(async (done) => {
          try {
            bcryptMock = jest.spyOn(bcrypt, 'hash');
            const { id, resetPasswordTokenVersion } = user;
            jest.spyOn(verifyConfirmation, 'resetPassword')
              .mockImplementationOnce(() => ({
                OK: true,
                id,
                resetPasswordTokenVersion,
              }));
            response = await request(app)
              .put('/users/resetPassword')
              .send({
                password: resetPassword,
                confirmPassword: resetPassword,
              })
              .set('confirmation', 'Bearer token');
            done();
          } catch (err) {
            done(err);
          }
        });
        it('should hash password', async () => {
          const { status } = response;
          const { password } = await user.reload();
          const passwordMatch = await bcrypt.compare(resetPassword, password);
          expect(status).toBe(204);
          expect(bcryptMock).toHaveBeenCalledTimes(1);
          expect(passwordMatch).toBe(true);
        });
        it('should increment auth token version', async () => {
          const { status } = response;
          const { authTokenVersion } = user;
          await user.reload();
          expect(status).toBe(204);
          expect(user.authTokenVersion).toBe(authTokenVersion + 1);
        });
        it('should increment resetPasswordTokenVersion', async () => {
          const { status } = response;
          const { resetPasswordTokenVersion } = user;
          await user.reload();
          expect(status).toBe(204);
          expect(user.resetPasswordTokenVersion).toBe(resetPasswordTokenVersion + 1);
        });
      });
      describe('should return error 400', () => {
        describe('if password', () => {
          beforeEach(async (done) => {
            try {
              const { id, resetPasswordTokenVersion } = user;
              jest.spyOn(verifyConfirmation, 'resetPassword')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id,
                  resetPasswordTokenVersion,
                }));
            } catch (err) {
              done(err);
            }
            done();
          });
          it('is not set', async () => {
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .set('confirmation', 'Bearer token')
              .send({});
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is empty', async () => {
            const password = '';
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_EMPTY,
              },
            });
          });
          it('is not a string', async () => {
            const password = 1234567890;
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_NOT_A_STRING,
              },
            });
          });
          it('contain less than 8 chars', async () => {
            const password = 'Aa9!';
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_MIN_LENGTH_OF_HEIGH,
              },
            });
          });
          it('contain more than 30 chars', async () => {
            const password = `Ac9!${'a'.repeat(31)}`;
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_MAX_LENGTH_THRITY,
              },
            });
          });
          it('doesn\'t contain any uppercase', async () => {
            const password = 'aaoudjivhds9!';
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_PASSWORD,
              },
            });
          });
          it('doesn\'t contain any lowercase', async () => {
            const password = 'AAOUDJIUVHDS9!';
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_PASSWORD,
              },
            });
          });
          it('doesn\'t contain any number', async () => {
            const password = 'Aaoudjiuvhds!';
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_PASSWORD,
              },
            });
          });
          it('doesn\'t contain any special char', async () => {
            const password = 'Aaoudjiuvhds9';
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password,
                confirmPassword: password,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_PASSWORD,
              },
            });
          });
        });
        describe('if confirm password', () => {
          beforeEach(async (done) => {
            try {
              const { id, resetPasswordTokenVersion } = user;
              jest.spyOn(verifyConfirmation, 'resetPassword')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id,
                  resetPasswordTokenVersion,
                }));
              done();
            } catch (err) {
              done(err);
            }
          });
          it('is empty', async () => {
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password: 'Aaoudjiuvhds9!',
                confirmPassword: '',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                confirmPassword: FIELD_IS_EMPTY,
              },
            });
          });
          it('and password not match', async () => {
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password: 'Aaoudjiuvhds9!',
                confirmPassword: 'Aaoudjiuvhds9',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                confirmPassword: FIELD_IS_CONFIRM_PASSWORD,
              },
            });
          });
        });
      });
      describe('should return error 401 if', () => {
        describe('if token', () => {
          const passwords = 'Aaoudjiuvhds9!';
          it('not found', async () => {
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
              });
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: TOKEN_NOT_FOUND,
            });
          });
          it('is not "Bearer ...', async () => {
            const { body, status } = await request(app)
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
              })
              .set('confirmation', 'token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: WRONG_TOKEN,
            });
          });
        });
        it('resetPasswordToken version doesn\'t match', async () => {
          const password = 'Aaoudjiuvhds9!';
          const { id, resetPasswordTokenVersion } = user;
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({
              id,
              resetPasswordTokenVersion: resetPasswordTokenVersion + 1,
            }));
          const { body, status } = await request(app)
            .put('/users/resetPassword')
            .send({
              password,
              confirmPassword: password,
            })
            .set('confirmation', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: WRONG_TOKEN_VERSION,
          });
        });
      });
      describe('should return error 404 if', () => {
        it('user not found', async () => {
          const { resetPasswordTokenVersion } = user;
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id: '1000',
              resetPasswordTokenVersion,
            }));
          const { body, status } = await request(app)
            .put('/users/resetPassword')
            .send({
              password: 'Aaoudjiuvhds9!',
              confirmPassword: 'Aaoudjiuvhds9!',
            })
            .set('confirmation', 'Bearer token');
          console.log(body);
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: USER_NOT_FOUND,
          });
        });
      });
    });
  });
});
