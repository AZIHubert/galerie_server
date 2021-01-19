import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';
import {
  FIELD_IS_CONFIRM_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_NOT_A_STRING,
  TOKEN_NOT_FOUND,
  USER_IS_LOGGED_IN,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
  FIELD_IS_PASSWORD,
} from '@src/helpers/errorMessages';

const sequelize = initSequelize();

const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjowfSwiZXhwIjowfQ.sM6G1FpEelcrwmKMlvWLfBk9rSBHLTPhHhZmgPOJXJg';

const newUser = {
  userName: 'user',
  email: 'user@email',
  password: 'password',
};

describe('users', () => {
  const verifyMocked = jest.spyOn(jwt, 'verify');
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
  describe('resetPassword', () => {
    describe('PUT', () => {
      describe('should return status 204', () => {
        const resetPassword = 'Aaoudjiuvhds9!';
        let response: request.Response;
        let bcryptMock: jest.SpyInstance;
        let user: User;
        let updatedUser: User;
        let authTokenVersion: number;
        let resetPasswordTokenVersion: number;
        beforeEach(async (done) => {
          try {
            user = await User.create(newUser);
            bcryptMock = jest.spyOn(bcrypt, 'hash');
            const { id } = user;
            authTokenVersion = user.authTokenVersion;
            resetPasswordTokenVersion = user.resetPasswordTokenVersion;
            verifyMocked.mockImplementationOnce(() => ({ id, resetPasswordTokenVersion }));
            response = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: resetPassword,
                confirmPassword: resetPassword,
              })
              .set('confirmation', 'Bearer token');
            updatedUser = await user.reload();
            done();
          } catch (err) {
            done(err);
          }
        });
        it('should hash password', async () => {
          const { status } = response;
          const { password } = updatedUser;
          const passwordMatch = await bcrypt.compare(resetPassword, password);
          expect(status).toBe(204);
          expect(bcryptMock).toHaveBeenCalledTimes(1);
          expect(passwordMatch).toBe(true);
        });
        it('should increment auth token version', async () => {
          const { status } = response;
          const { authTokenVersion: updatedAuthTokenVersion } = updatedUser;
          expect(status).toBe(204);
          expect(updatedAuthTokenVersion).toBe(authTokenVersion + 1);
        });
        it('should increment resetPasswordTokenVersion', async () => {
          const { status } = response;
          const {
            resetPasswordTokenVersion: updatedResetPasswordTokenVersion,
          } = updatedUser;
          expect(status).toBe(204);
          expect(updatedResetPasswordTokenVersion).toBe(resetPasswordTokenVersion + 1);
        });
      });
      describe('should return error 400', () => {
        describe('if token', () => {
          const passwords = 'Aaoudjiuvhds9!';
          it('not found', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: TOKEN_NOT_FOUND,
            });
            expect(verifyMocked).toHaveBeenCalledTimes(0);
          });
          it('is not "Bearer ...', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
              })
              .set('confirmation', 'token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: WRONG_TOKEN,
            });
            expect(verifyMocked).toHaveBeenCalledTimes(0);
          });
        });
        describe('if password', () => {
          beforeEach(async (done) => {
            try {
              const { id, resetPasswordTokenVersion } = await User.create(newUser);
              verifyMocked.mockImplementationOnce(() => ({ id, resetPasswordTokenVersion }));
              done();
            } catch (err) {
              done(err);
            }
          });
          it('is not set', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({})
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is empty', async () => {
            const passwords = '';
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = 1234567890;
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = 'Aa9!';
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = `Ac9!${'a'.repeat(31)}`;
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = 'aaoudjivhds9!';
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = 'AAOUDJIUVHDS9!';
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = 'Aaoudjiuvhds!';
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
            const passwords = 'Aaoudjiuvhds9';
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: passwords,
                confirmPassword: passwords,
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
              const { id, resetPasswordTokenVersion } = await User.create(newUser);
              verifyMocked.mockImplementationOnce(() => ({ id, resetPasswordTokenVersion }));
              done();
            } catch (err) {
              done(err);
            }
          });
          it('is empty', async () => {
            const { body, status } = await request(initApp())
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
            const { body, status } = await request(initApp())
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
        it('user is auth', async () => {
          const passwords = 'Aaoudjiuvhds9!';
          const { body, status } = await request(initApp())
            .put('/users/resetPassword')
            .send({
              password: passwords,
              confirmPassword: passwords,
            })
            .set('confirmation', 'Bearer token')
            .set('authorization', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: USER_IS_LOGGED_IN,
          });
        });
        it('resetPasswordToken version doesn\'t match', async () => {
          const passwords = 'Aaoudjiuvhds9!';
          const { id } = await User.create({
            ...newUser,
            resetPasswordTokenVersion: 1,
          });
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id, resetPasswordTokenVersion: 0 }));
          const { body, status } = await request(initApp())
            .put('/users/resetPassword')
            .send({
              password: passwords,
              confirmPassword: passwords,
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
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id: 1 }));
          const { body, status } = await request(initApp())
            .put('/users/resetPassword')
            .send({
              password: 'Aaoudjiuvhds9!',
              confirmPassword: 'Aaoudjiuvhds9!',
            })
            .set('confirmation', 'Bearer token');
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: USER_NOT_FOUND,
          });
        });
      });
      describe('should return error 500 if', () => {
        it('should return 500 is expired', async () => {
          const { status } = await request(initApp())
            .put('/users/resetPassword')
            .send({
              password: 'Aaoudjiuvhds9!',
              confirmPassword: 'Aaoudjiuvhds9!',
            })
            .set('confirmation', `Bearer ${EXPIRED_TOKEN}`);
          expect(status).toBe(500);
        });
      });
    });
  });
});
