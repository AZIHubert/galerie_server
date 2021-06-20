import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  FIELD_CANNOT_CONTAIN_SPACES,
  FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
  FIELD_CANNOT_BE_EMPTY,
  FIELD_SHOULD_BE_A_PASSWORD,
  FIELD_IS_ALREADY_TAKEN,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  FIELD_SHOULD_MATCH,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postUsersSignin,
  testUser,
} from '@src/helpers/test';
import validatePassword from '@src/helpers/validatePassword';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;

describe('/users', () => {
  describe('/signin', () => {
    describe('POST', () => {
      beforeAll(() => {
        app = initApp();
        sequelize = initSequelize();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
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
          app.close();
          done();
        } catch (err) {
          done(err);
        }
      });

      describe('should return status 200 and', () => {
        it('return a user created with an encrypted password', async () => {
          const email = 'user@email.com';
          const password = 'Password0!';
          const userName = 'user';
          const {
            body: {
              action,
              data: {
                user,
              },
            },
            status,
          } = await postUsersSignin(app, {
            body: {
              confirmPassword: password,
              email,
              password,
              userName,
            },
          });
          const storeUser = await User.findByPk(user.id) as User;
          const passwordIsValid = validatePassword(password, storeUser.hash, storeUser.salt);
          expect(action).toBe('POST');
          expect(passwordIsValid).toBeTruthy();
          expect(status).toBe(200);
          expect(storeUser.authTokenVersion).toBe(0);
          expect(storeUser.blackListedAt).toBeNull();
          expect(storeUser.confirmed).toBeFalsy();
          expect(storeUser.confirmTokenVersion).toBe(0);
          expect(storeUser.defaultProfilePicture).toBeNull();
          expect(storeUser.emailTokenVersion).toBe(0);
          expect(storeUser.facebookId).toBeNull();
          expect(storeUser.googleId).toBeNull();
          expect(storeUser.isBlackListed).toBe(false);
          expect(storeUser.resetPasswordTokenVersion).toBe(0);
          expect(storeUser.updatedEmailTokenVersion).toBe(0);
          testUser(user);
        });
        it('trim email and userName', async () => {
          const email = 'user@email.com';
          const password = 'Password0!';
          const userName = 'user';
          const {
            body: {
              data: {
                user: {
                  id: userId,
                },
              },
            },
          } = await postUsersSignin(app, {
            body: {
              confirmPassword: password,
              email: ` ${email} `,
              password,
              userName: ` ${userName} `,
            },
          });
          const user = await User.findByPk(userId) as User;
          expect(user.email).toBe(email);
          expect(user.pseudonym).toBe(userName);
          expect(user.userName).toBe(`@${userName}`);
        });
      });
      describe('should return 400 if', () => {
        describe('userName', () => {
          it('is not send', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: '',
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 1234,
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('contain spaces', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'userName with spaces',
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_CANNOT_CONTAIN_SPACES,
            });
            expect(status).toBe(400);
          });
          it('contain a special characters (#?!@$%^&*-.)', async () => {
            const password = 'Password0!';
            const body = {
              confirmPassword: password,
              email: 'user@email.com',
              password,
            };
            const {
              body: bodyOne,
              status,
            } = await postUsersSignin(app, {
              body: {
                ...body,
                userName: 'user.Name',
              },
            });
            const {
              body: bodyTwo,
            } = await postUsersSignin(app, {
              body: {
                ...body,
                userName: 'us@erName',
              },
            });
            const {
              body: bodyThree,
            } = await postUsersSignin(app, {
              body: {
                ...body,
                userName: 'userNa?me',
              },
            });
            expect(bodyOne.errors).toEqual({
              userName: FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
            });
            expect(bodyTwo.errors).toEqual({
              userName: FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
            });
            expect(bodyThree.errors).toEqual({
              userName: FIELD_CANNOT_CONTAIN_SPECIAL_CHARS,
            });
            expect(status).toBe(400);
          });
          it('is less than 3 characters', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'a'.repeat(2),
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_MIN_LENGTH(3),
            });
            expect(status).toBe(400);
          });
          it('is more than 30 characters', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'a'.repeat(31),
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_MAX_LENGTH(30),
            });
            expect(status).toBe(400);
          });
          it('is already taken', async () => {
            const password = 'Password0!';
            const userName = 'user';
            await createUser({
              userName,
            });
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user2@email.com',
                password,
                userName,
              },
            });
            expect(body.errors).toEqual({
              userName: FIELD_IS_ALREADY_TAKEN,
            });
            expect(status).toBe(400);
          });
        });
        describe('email', () => {
          it('is not send', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: '',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 1234,
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is not a valid email', async () => {
            const password = 'Password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'not an email',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_SHOULD_BE_AN_EMAIL,
            });
            expect(status).toBe(400);
          });
          it('is already taken', async () => {
            const password = 'Password0!';
            const email = 'user@email.com';
            await createUser({
              email,
            });
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email,
                password,
                userName: 'user2',
              },
            });
            expect(body.errors).toEqual({
              email: FIELD_IS_ALREADY_TAKEN,
            });
            expect(status).toBe(400);
          });
        });
        describe('password', () => {
          it('is not send', async () => {
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: 'Password0!',
                email: 'user@email.com',
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_SHOULD_MATCH('password'),
              password: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const password = '';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: 'Password0!',
                email: 'user@email.com',
                password: 1234,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_SHOULD_MATCH('password'),
              password: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('contain spaces', async () => {
            const password = 'Password with spaces0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_CANNOT_CONTAIN_SPACES,
            });
            expect(status).toBe(400);
          });
          it('contain less than 8 characters', async () => {
            const password = 'Aa0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_MIN_LENGTH(8),
            });
            expect(status).toBe(400);
          });
          it('contain more than 30 chars', async () => {
            const password = `A${'a'.repeat(30)}0!`;
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_MAX_LENGTH(30),
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any uppercase', async () => {
            const password = 'password0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any lowercase', async () => {
            const password = 'PASSWORD0!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any number', async () => {
            const password = 'Password!';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
          it('doesn\'t contain any special character', async () => {
            const password = 'Password0';
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: password,
                email: 'user@email.com',
                password,
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_PASSWORD,
            });
            expect(status).toBe(400);
          });
        });
        describe('confirmPassword', () => {
          it('is not send', async () => {
            const {
              body,
              status,
            } = await postUsersSignin(app, {
              body: {
                email: 'user@email.com',
                password: 'Password0!',
                userName: 'user',
              },
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
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: '',
                email: 'user@email.com',
                password: 'Password0!',
                userName: 'user',
              },
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
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: 1234,
                email: 'user@email.com',
                password: 'Password0!',
                userName: 'user',
              },
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
            } = await postUsersSignin(app, {
              body: {
                confirmPassword: 'wrongpassword',
                email: 'user@email.com',
                password: 'Password0!',
                userName: 'user',
              },
            });
            expect(body.errors).toEqual({
              confirmPassword: FIELD_SHOULD_MATCH('password'),
            });
            expect(status).toBe(400);
          });
        });
      });
    });
  });
});
