import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import * as email from '#src/helpers/email';
import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  MODEL_NOT_FOUND,
  USER_SHOULD_BE_CONFIRMED,
  USER_SHOULD_NOT_BE_BLACK_LISTED,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import {
  createUser,
  createBlackList,
  postUsersPassword,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let user: User;

const emailMocked = jest.spyOn(email, 'sendResetPassword');
const jwtMocked = jest.spyOn(jwt, 'sign');

describe('/users', () => {
  describe('/resetPassword', () => {
    describe('POST', () => {
      beforeEach(() => {
        app = initApp();
        sequelize = initSequelize();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const { user: createdUser } = await createUser({});

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
        it('send an email with and sign a token', async () => {
          const {
            status,
          } = await postUsersPassword(app, {
            body: {
              email: user.email,
            },
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
          await postUsersPassword(app, {
            body: {
              email: user.email,
            },
          });
          const { resetPasswordTokenVersion } = user;
          await user.reload();
          expect(user.resetPasswordTokenVersion)
            .toBe(resetPasswordTokenVersion + 1);
        });
        it('trim request.body.email', async () => {
          await postUsersPassword(app, {
            body: {
              email: ` ${user.email} `,
            },
          });
          expect(emailMocked)
            .toBeCalledWith(user.email, expect.any(String));
        });
        it('should convert email to lowercase', async () => {
          await postUsersPassword(app, {
            body: {
              email: user.email.toUpperCase(),
            },
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
              } = await postUsersPassword(app);
              expect(body.errors).toEqual({
                email: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is empty', async () => {
              const {
                body,
                status,
              } = await postUsersPassword(app, {
                body: {
                  email: '',
                },
              });
              expect(body.errors).toEqual({
                email: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await postUsersPassword(app, {
                body: {
                  email: 1234,
                },
              });
              expect(body.errors).toEqual({
                email: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is not a valid email', async () => {
              const {
                body,
                status,
              } = await postUsersPassword(app, {
                body: {
                  email: 'notAnEmail',
                },
              });
              expect(body.errors).toEqual({
                email: FIELD_SHOULD_BE_AN_EMAIL,
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('should return status 401 if', () => {
          it('user is not confirmed', async () => {
            const {
              user: {
                email: notConfirmedUserEmail,
              },
            } = await createUser({
              email: 'user2@email.com',
              confirmed: false,
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postUsersPassword(app, {
              body: {
                email: notConfirmedUserEmail,
              },
            });
            expect(body.errors).toBe(USER_SHOULD_BE_CONFIRMED);
            expect(status).toBe(401);
          });
          it('user is black listed', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              createdById: user.id,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await postUsersPassword(app, {
              body: {
                email: userTwo.email,
              },
            });
            expect(body.errors).toBe(USER_SHOULD_NOT_BE_BLACK_LISTED);
            expect(status).toBe(401);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await postUsersPassword(app, {
              body: {
                email: 'user2@email.com',
              },
            });
            expect(body.errors).toEqual({
              email: MODEL_NOT_FOUND('user'),
            });
            expect(status).toBe(404);
          });
          it('user is registered through Facebook', async () => {
            const {
              user: {
                email: facebookUserEmail,
              },
            } = await createUser({
              email: 'user2@email.com',
              facebookId: '1',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postUsersPassword(app, {
              body: {
                email: facebookUserEmail,
              },
            });
            expect(body.errors).toEqual({
              email: MODEL_NOT_FOUND('user'),
            });
            expect(status).toBe(404);
          });
          it('user is registered through Google', async () => {
            const {
              user: {
                email: googleUserEmail,
              },
            } = await createUser({
              email: 'user2@email.com',
              googleId: '1',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postUsersPassword(app, {
              body: {
                email: googleUserEmail,
              },
            });
            expect(body.errors).toEqual({
              email: MODEL_NOT_FOUND('user'),
            });
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
