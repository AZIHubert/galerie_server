import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let password: string;
let sequelize: Sequelize;
let user: User;
describe('/users', () => {
  describe('/login', () => {
    describe('POST', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const {
            password: createdPassword,
            user: createdUser,
          } = await createUser({});

          password = createdPassword;
          user = createdUser;
        } catch (err) {
          done(err);
        }
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
        it('return token and expiredIn', async () => {
          const {
            body: {
              data: {
                expiresIn,
                token,
              },
            },
            status,
          } = await postUsersLogin(app, {
            body: {
              password,
              userNameOrEmail: user.email,
            },
          });
          expect(expiresIn).toBe(1800);
          expect(token).not.toBeUndefined();
          expect(status).toBe(200);
        });
        it('trim request body.userNameOrEmail', async () => {
          const { status } = await postUsersLogin(app, {
            body: {
              password,
              userNameOrEmail: ` ${user.email} `,
            },
          });
          expect(status).toBe(200);
        });
      });
      describe('should return status 400', () => {
        describe('if usernameOrEmail is', () => {
          it('empty', async () => {
            const {
              body,
              status,
            } = await postUsersLogin(app, {
              body: {
                password,
                userNameOrEmail: '',
              },
            });
            expect(body.errors).toEqual({
              userNameOrEmail: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not a string', async () => {
            const {
              body,
              status,
            } = await postUsersLogin(app, {
              body: {
                password,
                userNameOrEmail: 1234,
              },
            });
            expect(body.errors).toEqual({
              userNameOrEmail: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
        });
        it('not send', async () => {
          const {
            body,
            status,
          } = await postUsersLogin(app, {
            body: {
              password,
            },
          });
          expect(body.errors).toEqual({
            userNameOrEmail: FIELD_IS_REQUIRED,
          });
          expect(status).toBe(400);
        });
      });
      describe('if password', () => {
        it('empty', async () => {
          const {
            body,
            status,
          } = await postUsersLogin(app, {
            body: {
              password: '',
              userNameOrEmail: user.email,
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
          } = await postUsersLogin(app, {
            body: {
              password: 1234,
              userNameOrEmail: user.email,
            },
          });
          expect(body.errors).toEqual({
            password: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is not send', async () => {
          const {
            body,
            status,
          } = await postUsersLogin(app, {
            body: {
              userNameOrEmail: user.email,
            },
          });
          expect(body.errors).toStrictEqual({
            password: FIELD_IS_REQUIRED,
          });
          expect(status).toBe(400);
        });
        it('not match', async () => {
          const {
            body,
            status,
          } = await postUsersLogin(app, {
            body: {
              password: 'wrong password',
              userNameOrEmail: user.email,
            },
          });
          expect(body.errors).toEqual({
            password: WRONG_PASSWORD,
          });
          expect(status).toBe(400);
        });
      });
    });
  });
});
