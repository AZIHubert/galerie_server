import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import * as verifyConfirmation from '@src/helpers/verifyConfirmation';
import {
  createUser,
  putUsersMeEmail,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/users', () => {
  let app: Server;
  let password: string;
  let sequelize: Sequelize;
  let user: User;
  let token: string;

  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
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

      const { body } = await postUsersLogin(app, {
        body: {
          password,
          userNameOrEmail: user.email,
        },
      });
      token = body.token;
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

  describe('/me', () => {
    describe('/email', () => {
      describe('put', () => {
        describe('should return status 200 and', () => {
          const updatedEmail = 'newemail@email.com';

          it('return token', async () => {
            jest.spyOn(verifyConfirmation, 'updateEmailToken')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                updatedEmail,
              }));
            const {
              body,
              status,
            } = await putUsersMeEmail(app, token, 'Bearer token', {
              password,
            });
            expect(body.expiresIn).toBe(1800);
            expect(typeof body.token).toBe('string');
            expect(status).toBe(200);
          });
          it('increment updatedEmailTokenVersion and authToken', async () => {
            jest.spyOn(verifyConfirmation, 'updateEmailToken')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                updatedEmail,
              }));
            await putUsersMeEmail(app, token, 'Bearer token', {
              password,
            });
            const {
              authTokenVersion,
              updatedEmailTokenVersion,
            } = user;
            await user.reload();
            expect(user.authTokenVersion).toBe(authTokenVersion + 1);
            expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
          });
          it('update user\'s email', async () => {
            jest.spyOn(verifyConfirmation, 'updateEmailToken')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                updatedEmail,
              }));
            await putUsersMeEmail(app, token, 'Bearer token', {
              password,
            });
            const { email } = await user.reload();
            expect(email).toBe(updatedEmail);
          });
          it('trim email', async () => {
            jest.spyOn(verifyConfirmation, 'updateEmailToken')
              .mockImplementationOnce(() => ({
                OK: true,
                id: user.id,
                updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                updatedEmail: ` ${updatedEmail} `,
              }));
            await putUsersMeEmail(app, token, 'Bearer token', {
              password,
            });
            const { email } = await user.reload();
            expect(email).toBe(updatedEmail);
          });
        });
        describe('should return status 400 if', () => {
          describe('password', () => {
            beforeEach(() => {
              jest.spyOn(verifyConfirmation, 'updateEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: user.id,
                  updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  updatedEmail: 'newemail@email.com',
                }));
            });
            it('is not send', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, 'Bearer token', {});
              expect(body.errors).toEqual({
                password: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, 'Bearer token', {
                password: '',
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
              } = await putUsersMeEmail(app, token, 'Bearer token', {
                password: 1234,
              });
              expect(body.errors).toEqual({
                password: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('not match', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, 'Bearer token', {
                password: 'wrong password',
              });
              expect(body.errors).toEqual({
                password: WRONG_PASSWORD,
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('should return error 401 if', () => {
          describe('confirmToken', () => {
            it('is not set', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, undefined, {
                password,
              });
              expect(body.errors).toBe(TOKEN_NOT_FOUND);
              expect(status).toBe(401);
            });
            it('is not \'Bearer ...\'', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, 'token', {
                password,
              });
              expect(body.errors).toBe(WRONG_TOKEN);
              expect(status).toBe(401);
            });
            it('is not correct version', async () => {
              jest.spyOn(verifyConfirmation, 'updateEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: user.id,
                  updatedEmailTokenVersion: user.updatedEmailTokenVersion + 1,
                  updatedEmail: 'newemail@email.com',
                }));
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, 'Bearer token', {
                password,
              });
              expect(body.errors).toBe(WRONG_TOKEN_VERSION);
              expect(status).toBe(401);
            });
            it('is not correct user', async () => {
              jest.spyOn(verifyConfirmation, 'updateEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: `${user.id}${user.id}`,
                  updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  updatedEmail: 'newemail@email.com',
                }));
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, 'Bearer token', {
                password,
              });
              expect(body.errors).toBe(WRONG_TOKEN_USER_ID);
              expect(status).toBe(401);
            });
            describe('.email', () => {
              it('is not set', async () => {
                jest.spyOn(verifyConfirmation, 'updateEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  }));
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, 'Bearer token', {
                  password,
                });
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_IS_REQUIRED}`);
                expect(status).toBe(401);
              });
              it('is an empty string', async () => {
                jest.spyOn(verifyConfirmation, 'updateEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                    updatedEmail: '',
                  }));
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, 'Bearer token', {
                  password,
                });
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_CANNOT_BE_EMPTY}`);
                expect(status).toBe(401);
              });
              it('is not a string', async () => {
                jest.spyOn(verifyConfirmation, 'updateEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                    updatedEmail: 1234,
                  }));
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, 'Bearer token', {
                  password,
                });
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_SHOULD_BE_A_STRING}`);
                expect(status).toBe(401);
              });
              it('is not an email', async () => {
                jest.spyOn(verifyConfirmation, 'updateEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                    updatedEmail: 'not an email',
                  }));
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, 'Bearer token', {
                  password,
                });
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_SHOULD_BE_AN_EMAIL}`);
                expect(status).toBe(401);
              });
              it('is the same has the old one', async () => {
                jest.spyOn(verifyConfirmation, 'updateEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                    updatedEmail: user.email,
                  }));
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, 'Bearer token', {
                  password,
                });
                expect(body.errors).toBe(`${WRONG_TOKEN}: email should be different`);
                expect(status).toBe(401);
              });
            });
          });
        });
      });
    });
  });
});
