import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import {
  FIELD_CANNOT_CONTAIN_SPACES,
  FIELD_CANNOT_BE_EMPTY,
  FIELD_SHOULD_BE_A_PASSWORD,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_MATCH,
  WRONG_PASSWORD,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import validatePassword from '#src/helpers/validatePassword';
import {
  createUser,
  putUsersMePassword,
} from '#src/helpers/test';

import initApp from '#src/server';

const userPassword = 'Password0!';
let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/me', () => {
    describe('/password', () => {
      beforeAll(() => {
        app = initApp();
        sequelize = initSequelize();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const {
            user: createdUser,
          } = await createUser({});
          user = createdUser;
          const jwt = signAuthToken(user);
          token = jwt.token;
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

      describe('should return status 200 and', () => {
        it('should return authToken', async () => {
          const newPassword = 'NewPassword0!';
          const {
            body: {
              data: {
                expiresIn,
                token: returnedToken,
              },
            },
            status,
          } = await putUsersMePassword(app, token, {
            body: {
              confirmNewPassword: newPassword,
              currentPassword: userPassword,
              newPassword,
            },
          });
          expect(expiresIn).toBe(1800);
          expect(returnedToken).not.toBeUndefined();
          expect(status).toBe(200);
        });
        it('should hash password and update user\'s password', async () => {
          const newPassword = 'NewPassword0!';
          await putUsersMePassword(app, token, {
            body: {
              confirmNewPassword: newPassword,
              currentPassword: userPassword,
              newPassword,
            },
          });
          await user.reload();
          const passwordIsValid = validatePassword(newPassword, user.hash, user.salt);
          expect(passwordIsValid).toBeTruthy();
        });
        it('should increment authTokenVersion', async () => {
          const newPassword = 'NewPassword0!';
          await putUsersMePassword(app, token, {
            body: {
              confirmNewPassword: newPassword,
              currentPassword: userPassword,
              newPassword,
            },
          });
          const { authTokenVersion } = user;
          await user.reload();
          expect(user.authTokenVersion).toBe(authTokenVersion + 1);
        });
      });
      describe('should return error 400 if', () => {
        describe('confirmNewPassword', () => {
          it('is not send', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                currentPassword: userPassword,
                newPassword: 'NewPassword0!',
              },
            });
            expect(body.errors).toEqual({
              confirmNewPassword: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: '',
                currentPassword: userPassword,
                newPassword: 'NewPassword0!',
              },
            });
            expect(body.errors).toEqual({
              confirmNewPassword: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: 1234,
                currentPassword: userPassword,
                newPassword: 'NewPassword0!',
              },
            });
            expect(body.errors).toEqual({
              confirmNewPassword: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('and newPassword not match', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: 'wrongPassword',
                currentPassword: userPassword,
                newPassword: 'NewPassword0!',
              },
            });
            expect(body.errors).toEqual({
              confirmNewPassword: FIELD_SHOULD_MATCH('password'),
            });
            expect(status).toBe(400);
          });
        });
        describe('currentPassword', () => {
          it('is not sent', async () => {
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              currentPassword: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: '',
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              currentPassword: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('it not a string', async () => {
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: 1234,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              currentPassword: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t match user\'s password', async () => {
            const newPassword = 'NewPassword0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: 'wrongPassword',
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              currentPassword: WRONG_PASSWORD,
            });
            expect(status).toBe(400);
          });
        });
        describe('newPassword', () => {
          it('is not send', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: 'NewPassword0!',
                currentPassword: userPassword,
              },
            });
            expect(body.errors).toEqual({
              confirmNewPassword: FIELD_SHOULD_MATCH('password'),
              newPassword: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: '',
                currentPassword: userPassword,
                newPassword: '',
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: 1234,
                currentPassword: userPassword,
                newPassword: 1234,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('contain spaces', async () => {
            const newPassword = 'New Password0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_CANNOT_CONTAIN_SPACES,
            });
            expect(status).toBe(400);
          });
          it('contain less than 8 characters', async () => {
            const newPassword = 'Aa0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_MIN_LENGTH(8),
            });
            expect(status).toBe(400);
          });
          it('contain more than 30 characters', async () => {
            const newPassword = `A${'a'.repeat(30)}0!`;
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_MAX_LENGTH(30),
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any uppercase', async () => {
            const newPassword = 'newpassword0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any lowercase', async () => {
            const newPassword = 'NEWPASSWORD0!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any number', async () => {
            const newPassword = 'NewPassword!';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any special characters', async () => {
            const newPassword = 'NewPassword0';
            const {
              body,
              status,
            } = await putUsersMePassword(app, token, {
              body: {
                confirmNewPassword: newPassword,
                currentPassword: userPassword,
                newPassword,
              },
            });
            expect(body.errors).toEqual({
              newPassword: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
        });
      });
    });
  });
});
