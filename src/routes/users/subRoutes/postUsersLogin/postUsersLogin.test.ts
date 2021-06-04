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
  login,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({});
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

  describe('/login', () => {
    describe('POST', () => {
      describe('should return status 200 and', () => {
        it('return token', async () => {
          const {
            body,
            status,
          } = await login(
            app,
            user.email,
            userPassword,
          );
          expect(body.expiresIn).toBe(1800);
          expect(body.token).not.toBeUndefined();
          expect(status).toBe(200);
        });
        it('trim request body.userNameOrEmail', async () => {
          const { status } = await login(
            app,
            ` ${user.email} `,
            userPassword,
          );
          expect(status).toBe(200);
        });
      });
      describe('should return status 400', () => {
        describe('if usernameOrEmail is', () => {
          it('empty', async () => {
            const {
              body,
              status,
            } = await login(
              app,
              '',
              userPassword,
            );
            expect(body.errors).toEqual({
              userNameOrEmail: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not a string', async () => {
            const {
              body,
              status,
            } = await login(
              app,
              123,
              userPassword,
            );
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
          } = await login(
            app,
            undefined,
            userPassword,
          );
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
          } = await login(
            app,
            user.email,
            '',
          );
          expect(body.errors).toEqual({
            password: FIELD_CANNOT_BE_EMPTY,
          });
          expect(status).toBe(400);
        });
        it('is not a string', async () => {
          const {
            body,
            status,
          } = await login(
            app,
            user.email,
            123,
          );
          expect(body.errors).toEqual({
            password: FIELD_SHOULD_BE_A_STRING,
          });
          expect(status).toBe(400);
        });
        it('is not send', async () => {
          const {
            body,
            status,
          } = await login(
            app,
            user.email,
          );
          expect(body.errors).toStrictEqual({
            password: FIELD_IS_REQUIRED,
          });
          expect(status).toBe(400);
        });
        it('not match', async () => {
          const {
            body,
            status,
          } = await login(
            app,
            user.email,
            'wrong password',
          );
          expect(body.errors).toEqual({
            password: WRONG_PASSWORD,
          });
          expect(status).toBe(400);
        });
      });
    });
  });
});
