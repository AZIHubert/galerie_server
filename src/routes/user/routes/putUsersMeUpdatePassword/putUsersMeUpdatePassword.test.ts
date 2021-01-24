import bcrypt from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import {
  FIELD_IS_EMPTY,
  FIELD_IS_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_HEIGH,
  FIELD_NOT_A_STRING,
  FIELD_IS_CONFIRM_PASSWORD,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const clearDatas = async () => {
  await User.sync({ force: true });
};

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'user',
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas();
      const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      await agent
        .get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
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
      await clearDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('me', () => {
    describe('updatePassword', () => {
      describe('should return status 200 and', () => {
        const updatedPassword = 'Aaoudjiuvhds9!';
        let hashMocked: jest.SpyInstance;
        let response: request.Response;
        beforeEach(async (done) => {
          try {
            hashMocked = jest.spyOn(bcrypt, 'hash');
            response = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
          } catch (err) {
            done(err);
          }
          done();
        });
        it('should hash password', async () => {
          const { status } = response;
          expect(status).toBe(200);
          expect(hashMocked).toHaveBeenCalledTimes(1);
          expect(hashMocked).toHaveBeenCalledWith(updatedPassword, saltRounds);
        });
        it('should update user password', async () => {
          const { status } = response;
          const { password } = await user.reload();
          const updatedPasswordsMatch = await bcrypt.compare(updatedPassword, password);
          expect(status).toBe(200);
          expect(updatedPasswordsMatch).toBe(true);
        });
        it('should increment authTokenVersion', async () => {
          const { status } = response;
          const { authTokenVersion } = user;
          const { authTokenVersion: updatedAuthTokenVersion } = await user.reload();
          expect(status).toBe(200);
          expect(updatedAuthTokenVersion).toBe(authTokenVersion + 1);
        });
      });
      describe('should return error 400 if', () => {
        describe('password', () => {
          const updatedPassword = 'Aaoudjiuvhds9!';
          it('is not sent', async () => {
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                confirmUpdatedPassword: updatedPassword,
                updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is empty', async () => {
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: '',
                confirmUpdatedPassword: updatedPassword,
                updatedPassword,
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
          it('and confirmed password are not send', async () => {
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_REQUIRED,
                confirmUpdatedPassword: FIELD_IS_REQUIRED,
              },
            });
          });
          it('is not a string', async () => {
            const updatedPassword = 12345;
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_NOT_A_STRING,
              },
            });
          });
          it('is empty', async () => {
            const updatedPassword = '';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_EMPTY,
              },
            });
          });
          it('is less than 8 characters', async () => {
            const updatedPassword = 'Aa8!';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_MIN_LENGTH_OF_HEIGH,
              },
            });
          });
          it('is more than 30 characters', async () => {
            const updatedPassword = `Ac9!${'a'.repeat(31)}`;
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_MAX_LENGTH_THRITY,
              },
            });
          });
          it('does not contain lowercase', async () => {
            const updatedPassword = 'aaoudjiuvhds9!';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
          it('does not contain uppercase', async () => {
            const updatedPassword = 'AAOUDJIUVHDS9!';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
          it('does not contain number', async () => {
            const updatedPassword = 'Aaoudjiuvhds!';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                updatedPassword: FIELD_IS_PASSWORD,
              },
            });
          });
          it('does not contain special char', async () => {
            const updatedPassword = 'Aaoudjiuvhds9';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
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
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
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
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: newUser.password,
                updatedPassword: 'Aaoudjiuvhds9!',
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
            const updatedPassword = 'Aaoudjiuvhds9!';
            const { status, body } = await agent
              .put('/users/me/updatePassword')
              .send({
                password: 'wrongPassword',
                updatedPassword,
                confirmUpdatedPassword: updatedPassword,
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
      describe('should return error 500 if', () => {
        it('bcrypt fail to compare passwords', async () => {
          const updatedPassword = 'Aaoudjiuvhds9!';
          jest.spyOn(bcrypt, 'compare')
            .mockImplementationOnce(() => {
              throw new Error('something went wrong');
            });
          const { status } = await agent
            .put('/users/me/updatePassword')
            .send({
              password: newUser.password,
              updatedPassword,
              confirmUpdatedPassword: updatedPassword,
            });
          expect(status).toBe(500);
        });
        it('bcrypt fail to hash updated password', async () => {
          const updatedPassword = 'Aaoudjiuvhds9!';
          jest.spyOn(bcrypt, 'hash')
            .mockImplementationOnce(() => {
              throw new Error('something went wrong');
            });
          const { status } = await agent
            .put('/users/me/updatePassword')
            .send({
              password: newUser.password,
              updatedPassword,
              confirmUpdatedPassword: updatedPassword,
            });
          expect(status).toBe(500);
        });
      });
    });
  });
});
