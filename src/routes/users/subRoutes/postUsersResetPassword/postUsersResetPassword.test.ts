// import { hash } from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import * as email from '@src/helpers/email';
import {
  FIELD_NOT_A_STRING,
  FIELD_IS_EMAIL,
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  NOT_CONFIRMED,
  USER_IS_BLACK_LISTED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postResetPassword,
} from '@src/helpers/test';

import initApp from '@src/server';

const emailMocked = jest.spyOn(email, 'sendResetPassword');
const jwtMocked = jest.spyOn(jwt, 'sign');

describe('users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let user: User;

  beforeEach(() => {
    app = initApp();
    sequelize = initSequelize();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({});
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

  describe('resetPassword', () => {
    describe('POST', () => {
      describe('should return status 204 and', () => {
        it('send an email with and sign a token', async () => {
          const {
            status,
          } = await postResetPassword(app, {
            email: user.email,
          });
          expect(status).toBe(204);
          expect(emailMocked)
            .toHaveBeenCalledTimes(1);
          expect(emailMocked)
            .toBeCalledWith(user.email, expect.any(String));
          expect(jwtMocked)
            .toHaveBeenCalledTimes(1);
        });
        it('increment resetPasswordTokenVersion', async () => {
          await postResetPassword(app, {
            email: user.email,
          });
          const { resetPasswordTokenVersion } = user;
          await user.reload();
          expect(user.resetPasswordTokenVersion)
            .toBe(resetPasswordTokenVersion + 1);
        });
        it('trim request.body.email', async () => {
          await postResetPassword(app, {
            email: ` ${user.email} `,
          });
          expect(emailMocked)
            .toBeCalledWith(user.email, expect.any(String));
        });
        it('should convert email to lowercase', async () => {
          await postResetPassword(app, {
            email: user.email.toUpperCase(),
          });
          expect(emailMocked)
            .toBeCalledWith(user.email, expect.any(String));
        });
        describe('should return status 400 if', () => {
          describe('password', () => {
            it('is not send', async () => {
              const {
                body,
                status,
              } = await postResetPassword(app, {});
              expect(body.errors).toEqual({
                email: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is empty', async () => {
              const {
                body,
                status,
              } = await postResetPassword(app, {
                email: '',
              });
              expect(body.errors).toEqual({
                email: FIELD_IS_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await postResetPassword(app, {
                email: 1234,
              });
              expect(body.errors).toEqual({
                email: FIELD_NOT_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is not a valid email', async () => {
              const {
                body,
                status,
              } = await postResetPassword(app, {
                email: 'notAnEmail',
              });
              expect(body.errors).toEqual({
                email: FIELD_IS_EMAIL,
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('should return status 401 if', () => {
          it('user is not confirmed', async () => {
            const { email: notConfirmedUserEmail } = await createUser({
              email: 'user2@email.com',
              confirmed: false,
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postResetPassword(app, {
              email: notConfirmedUserEmail,
            });
            expect(body.errors).toBe(NOT_CONFIRMED);
            expect(status).toBe(401);
          });
          it('user is black listed', async () => {
            const {
              email: blackListedUserEmail,
              id,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await BlackList.create({
              adminId: user.id,
              reason: 'black list user',
              userId: id,
            });
            const {
              body,
              status,
            } = await postResetPassword(app, {
              email: blackListedUserEmail,
            });
            expect(body.errors).toBe(USER_IS_BLACK_LISTED);
            expect(status).toBe(401);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await postResetPassword(app, {
              email: 'user2@email.com',
            });
            expect(body.errors).toEqual({
              email: USER_NOT_FOUND,
            });
            expect(status).toBe(404);
          });
          it('user is registered through Facebook', async () => {
            const { email: facebookUserEmail } = await createUser({
              email: 'user2@email.com',
              facebookId: '1',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postResetPassword(app, {
              email: facebookUserEmail,
            });
            expect(body.errors).toEqual({
              email: USER_NOT_FOUND,
            });
            expect(status).toBe(404);
          });
          it('user is registered through Google', async () => {
            const { email: googleUserEmail } = await createUser({
              email: 'user2@email.com',
              googleId: '1',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postResetPassword(app, {
              email: googleUserEmail,
            });
            expect(body.errors).toEqual({
              email: USER_NOT_FOUND,
            });
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
