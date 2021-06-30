import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import accEnv from '#src/helpers/accEnv';
import {
  INVALID_UUID,
  FIELD_CANNOT_CONTAIN_SPACES,
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_PASSWORD,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_MATCH,
  MODEL_NOT_FOUND,
  TOKEN_NOT_FOUND,
  USER_SHOULD_BE_CONFIRMED,
  USER_SHOULD_NOT_BE_BLACK_LISTED,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import validatePassword from '#src/helpers/validatePassword';
import * as verifyConfirmation from '#src/helpers/verifyConfirmation';
import {
  createUser,
  createBlackList,
  putUsersPassword,
} from '#src/helpers/test';

import initApp from '#src/server';

const RESET_PASSWORD_SECRET = accEnv('RESET_PASSWORD_SECRET');
let app: Server;
let sequelize: Sequelize;
let user: User;

describe('/users', () => {
  describe('/resetPassword', () => {
    describe('PUT', () => {
      beforeAll(() => {
        app = initApp();
        sequelize = initSequelize();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const { user: createdUser } = await createUser({
            role: 'admin',
          });
          user = createdUser;
        } catch (err) {
          done(err);
        }
        jest.clearAllMocks();
        done();
      });

      afterAll(async (done) => {
        try {
          await sequelize.sync({ force: true });
          await sequelize.close();
        } catch (err) {
          done(err);
        }
        app.close();
        done();
      });
      describe('should return status 204 and', () => {
        beforeEach(() => {
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id: user.id,
              resetPasswordTokenVersion: user.resetPasswordTokenVersion,
            }));
        });
        it('hash password and update user\'s password', async () => {
          const newPassword = 'NewPassword0!';
          const {
            status,
          } = await putUsersPassword(app, {
            body: {
              confirmPassword: newPassword,
              password: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          await user.reload();
          const passwordIsValid = validatePassword(newPassword, user.hash, user.salt);
          expect(passwordIsValid).toBeTruthy();
          expect(status).toBe(204);
        });
        it('increment authToken and resetPasswordTokenVersion version', async () => {
          const newPassword = 'NewPassword0!';
          await putUsersPassword(app, {
            body: {
              confirmPassword: newPassword,
              password: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          const {
            authTokenVersion,
            resetPasswordTokenVersion,
          } = user;
          await user.reload();
          expect(user.authTokenVersion).toBe(authTokenVersion + 1);
          expect(user.resetPasswordTokenVersion).toBe(resetPasswordTokenVersion + 1);
        });
      });
      describe('should return status 400 if', () => {
        it('confirmToken.id is not a UUIDv4', async () => {
          const newPassword = 'NewPassword0!';
          const confirmToken = sign(
            {
              id: '100',
              resetPasswordTokenVersion: user.resetPasswordTokenVersion,
            },
            RESET_PASSWORD_SECRET,
            {
              expiresIn: '30m',
            },
          );
          const {
            body,
            status,
          } = await putUsersPassword(app, {
            body: {
              password: newPassword,
              confirmPassword: newPassword,
            },
            confirmToken: `Bearer ${confirmToken}`,
          });
          expect(body.errors).toBe(`confirmation token error: ${INVALID_UUID('user')}`);
          expect(status).toBe(400);
        });
        it('user is not confirmed', async () => {
          const newPassword = 'NewPassword0!';
          const {
            user: {
              id,
              resetPasswordTokenVersion,
            },
          } = await createUser({
            confirmed: false,
            email: 'user2@email.com',
            userName: 'user2',
          });
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id,
              resetPasswordTokenVersion,
            }));
          const {
            body,
            status,
          } = await putUsersPassword(app, {
            body: {
              password: newPassword,
              confirmPassword: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(USER_SHOULD_BE_CONFIRMED);
          expect(status).toBe(400);
        });
        it('user is black listed', async () => {
          const newPassword = 'NewPassword0!';
          const {
            user: {
              id,
              resetPasswordTokenVersion,
            },
          } = await createUser({
            email: 'user2@email.com',
            role: 'admin',
            userName: 'user2',
          });
          await createBlackList({
            createdById: user.id,
            userId: id,
          });
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id,
              resetPasswordTokenVersion,
            }));
          const {
            body,
            status,
          } = await putUsersPassword(app, {
            body: {
              confirmPassword: newPassword,
              password: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(USER_SHOULD_NOT_BE_BLACK_LISTED);
          expect(status).toBe(400);
        });
        describe('confirmPassword', () => {
          beforeEach(() => {
            jest.spyOn(verifyConfirmation, 'resetPassword')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                resetPasswordTokenVersion: user.resetPasswordTokenVersion,
              }));
          });
          it('is not send', async () => {
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: 'NewPassword0!',
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: '',
                password: 'NewPassword0!',
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: 1234,
                password: 'NewPassword0!',
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('and password not match', async () => {
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: 'wrongPassword',
                password: 'NewPassword0!',
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_SHOULD_MATCH('password'),
            });
            expect(status).toBe(400);
          });
        });
        describe('password', () => {
          beforeEach(() => {
            jest.spyOn(verifyConfirmation, 'resetPassword')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                resetPasswordTokenVersion: user.resetPasswordTokenVersion,
              }));
          });
          it('is not send', async () => {
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: 'NewPassword0!',
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_SHOULD_MATCH('password'),
              password: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const newPassword = '';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: newPassword,
                confirmPassword: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const newPassword = 1234;
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: newPassword,
                confirmPassword: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('contain spaces', async () => {
            const newPassword = 'New Password0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: newPassword,
                confirmPassword: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_CANNOT_CONTAIN_SPACES,
            });
            expect(status).toBe(400);
          });
          it('contain less than 8 characters', async () => {
            const newPassword = 'Aa0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: newPassword,
                confirmPassword: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_MIN_LENGTH(8),
            });
            expect(status).toBe(400);
          });
          it('contain more than 30 characters', async () => {
            const newPassword = `A${'a'.repeat(30)}0!`;
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: newPassword,
                confirmPassword: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_MAX_LENGTH(30),
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any uppercase', async () => {
            const newPassword = 'newpassword0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                password: newPassword,
                confirmPassword: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any lowercase', async () => {
            const newPassword = 'NEWPASSWORD0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: newPassword,
                password: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any number', async () => {
            const newPassword = 'NewPassword!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: newPassword,
                password: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any special character', async () => {
            const newPassword = 'NewPassword0';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: newPassword,
                password: newPassword,
              },
              confirmToken: 'Bearer token',
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return status 401 if', () => {
        describe('confirmToken', () => {
          it('is not set', async () => {
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: newPassword,
                password: newPassword,
              },
            });
            expect(body.errors).toBe(TOKEN_NOT_FOUND);
            expect(status).toBe(401);
          });
          it('is not \'Bearer ...\'', async () => {
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: newPassword,
                password: newPassword,
              },
              confirmToken: 'token',
            });
            expect(body.errors).toBe(WRONG_TOKEN);
            expect(status).toBe(401);
          });
          it('is not correct version', async () => {
            jest.spyOn(verifyConfirmation, 'resetPassword')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                resetPasswordTokenVersion: user.resetPasswordTokenVersion + 1,
              }));
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersPassword(app, {
              body: {
                confirmPassword: newPassword,
                password: newPassword,
              },
              confirmToken: 'token',
            });
            expect(body.errors).toBe(WRONG_TOKEN_VERSION);
            expect(status).toBe(401);
          });
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          const newPassword = 'NewPassword0!';
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id: uuidv4(),
              resetPasswordTokenVersion: user.resetPasswordTokenVersion,
            }));
          const {
            body,
            status,
          } = await putUsersPassword(app, {
            body: {
              confirmPassword: newPassword,
              password: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
        it('user is register with Facebook', async () => {
          const newPassword = 'NewPassword0!';
          const {
            user: {
              id,
              resetPasswordTokenVersion,
            },
          } = await createUser({
            email: 'user2@email.com',
            facebookId: '1',
            userName: 'user2',
          });
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id,
              resetPasswordTokenVersion,
            }));
          const {
            body,
            status,
          } = await putUsersPassword(app, {
            body: {
              confirmPassword: newPassword,
              password: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
        it('user is register with Google', async () => {
          const newPassword = 'NewPassword0!';
          const {
            user: {
              id,
              resetPasswordTokenVersion,
            },
          } = await createUser({
            email: 'user2@email.com',
            googleId: '1',
            userName: 'user2',
          });
          jest.spyOn(verifyConfirmation, 'resetPassword')
            .mockImplementationOnce(() => ({
              OK: true,
              id,
              resetPasswordTokenVersion,
            }));
          const {
            body,
            status,
          } = await putUsersPassword(app, {
            body: {
              confirmPassword: newPassword,
              password: newPassword,
            },
            confirmToken: 'Bearer token',
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
