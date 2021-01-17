import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';
import {
  TOKEN_NOT_FOUND,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';

const sequelize = initSequelize();

const EXPIRED_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjowfSwiZXhwIjowfQ.sM6G1FpEelcrwmKMlvWLfBk9rSBHLTPhHhZmgPOJXJg';

describe('users', () => {
  let jwtMock: jest.SpyInstance;

  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    jwtMock = jest.spyOn(jwt, 'verify');
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
  describe('resetPassword', () => {
    describe('PUT', () => {
      it('should hash password', async () => {
        const { id, resetPasswordTokenVersion } = await User.create({
          userName: 'user',
          email: 'user@email',
          password: 'password',
          confirm: false,
          authTokenVersion: 0,
          admin: false,
        });
        const bcryptMock = jest.spyOn(bcrypt, 'hash');
        jwtMock.mockImplementationOnce(() => ({
          id,
          resetPasswordTokenVersion,
        }));
        const { status } = await request(initApp())
          .put('/users/resetPassword')
          .send({
            password: 'Aaoudjiuvhds9!',
            confirmPassword: 'Aaoudjiuvhds9!',
          })
          .set('confirmation', 'Bearer token');
        const { password } = await User.findByPk(id) as User;
        const passwordMatch = await bcrypt.compare('Aaoudjiuvhds9!', password);
        expect(status).toBe(204);
        expect(bcryptMock).toHaveBeenCalledTimes(1);
        expect(passwordMatch).toBe(true);
      });
      it('should increment auth token version', async () => {
        const { id, resetPasswordTokenVersion } = await User.create({
          userName: 'user',
          email: 'user@email',
          password: 'password',
          confirmed: false,
          authTokenVersion: 0,
          admin: false,
        });
        jwtMock.mockImplementationOnce(() => ({
          id,
          resetPasswordTokenVersion,
        }));
        const { status } = await request(initApp())
          .put('/users/resetPassword')
          .send({
            password: 'Aaoudjiuvhds9!',
            confirmPassword: 'Aaoudjiuvhds9!',
          })
          .set('confirmation', 'Bearer token');
        const { authTokenVersion } = await User.findByPk(id) as User;
        expect(status).toBe(204);
        expect(authTokenVersion).toBe(1);
      });
      it('should increment resetPasswordTokenVersion', async () => {
        const { id, resetPasswordTokenVersion } = await User.create({
          userName: 'user',
          email: 'user@email',
          password: 'password',
        });
        jwtMock.mockImplementationOnce(() => ({
          id,
          resetPasswordTokenVersion,
        }));
        const { status } = await request(initApp())
          .put('/users/resetPassword')
          .send({
            password: 'Aaoudjiuvhds9!',
            confirmPassword: 'Aaoudjiuvhds9!',
          })
          .set('confirmation', 'Bearer token');
        const updatedUser = await User.findByPk(id);
        expect(status).toBe(204);
        expect(updatedUser!.resetPasswordTokenVersion).toBe(resetPasswordTokenVersion + 1);
      });
      describe('should return error 401 if', () => {
        it('user is auth', async () => {
          const { body, status } = await request(initApp())
            .put('/users/resetPassword')
            .send({
              password: 'Aaoudjiuvhds9!',
              confirmPassword: 'Aaoudjiuvhds9!',
            })
            .set('confirmation', 'Bearer token')
            .set('authorization', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'you are already authenticated',
          });
        });
        it('resetPasswordToken version doesn\'t match', async () => {
          const { id } = await User.create({
            userName: 'user',
            email: 'user@email',
            password: 'password',
            confirm: false,
            authTokenVersion: 0,
            admin: false,
            resetPasswordToken: 1,
          });
          jwtMock.mockImplementationOnce(() => ({
            id,
            resetPasswordToken: 0,
          }));
          const { body, status } = await request(initApp())
            .put('/users/resetPassword')
            .send({})
            .set('confirmation', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: WRONG_TOKEN_VERSION,
          });
        });
      });
      it('should return error 404 if user not found', async () => {
        jwtMock.mockImplementationOnce(() => ({
          id: 1,
        }));
        const { body, status } = await request(initApp())
          .put('/users/resetPassword')
          .send({
            password: 'Aaoudjiuvhds9!',
            confirmPassword: 'Aaoudjiuvhds9!',
          })
          .set('confirmation', 'Bearer token');
        expect(status).toBe(404);
        expect(body).toStrictEqual({
          errors: 'user not found',
        });
      });
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
      describe('should return error 400', () => {
        describe('if token', () => {
          it('not found', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'Aaoudjiuvhds9!',
                confirmPassword: 'Aaoudjiuvhds9!',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: TOKEN_NOT_FOUND,
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
          it('is not "Bearer ...', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'Aaoudjiuvhds9!',
                confirmPassword: 'Aaoudjiuvhds9!',
              })
              .set('confirmation', 'token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'wrong token',
            });
            expect(jwtMock).toHaveBeenCalledTimes(0);
          });
        });
        describe('if password', () => {
          beforeEach(async (done) => {
            const { id, resetPasswordTokenVersion } = await User.create({
              userName: 'user',
              email: 'user@email',
              password: 'password',
            });
            jwtMock = jest.spyOn(jwt, 'verify').mockImplementationOnce(() => ({
              id,
              resetPasswordTokenVersion,
            }));
            done();
          });
          it('is not set', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({})
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'is required',
              },
            });
          });
          it('is empty', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: '',
                confirmPassword: '',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'cannot be an empty field',
              },
            });
          });
          it('is not a string', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 12345678,
                confirmPassword: 12345678,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'should be a type of \'text\'',
              },
            });
          });
          it('contain less than 8 chars', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'Aa9!',
                confirmPassword: 'Aa9!',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'should have a minimum length of 8',
              },
            });
          });
          it('contain more than 30 chars', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: `Ac9!${'a'.repeat(31)}`,
                confirmPassword: `Ac9!${'a'.repeat(31)}`,
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'should have a maximum length of 30',
              },
            });
          });
          it('doesn\'t contain any uppercase', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'aaoudjivhds9!',
                confirmPassword: 'aaoudjivhds9!',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
          it('doesn\'t contain any lowercase', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'AAOUDJIUVHDS9!',
                confirmPassword: 'AAOUDJIUVHDS9!',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
          it('doesn\'t contain any number', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'AAOUDJIUVHDS!',
                confirmPassword: 'AAOUDJIUVHDS!',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
          it('doesn\'t contain any special char', async () => {
            const { body, status } = await request(initApp())
              .put('/users/resetPassword')
              .send({
                password: 'Aaoudjiuvhds9',
                confirmPassword: 'Aaoudjiuvhds9',
              })
              .set('confirmation', 'Bearer token');
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: 'need at least on lowercase, one uppercase, one number and one special char',
              },
            });
          });
        });
        describe('if confirm password', () => {
          beforeEach(async (done) => {
            const { id, resetPasswordTokenVersion } = await User.create({
              userName: 'user',
              email: 'user@email',
              password: 'password',
            });
            jwtMock = jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id,
                resetPasswordTokenVersion,
              }));
            done();
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
                confirmPassword: 'cannot be an empty field',
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
                confirmPassword: 'must match password',
              },
            });
          });
        });
      });
    });
  });
});
