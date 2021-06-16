import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';

import * as email from '@src/helpers/email';
import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_SHOULD_BE_AN_EMAIL,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import * as verifyConfirmation from '@src/helpers/verifyConfirmation';
import {
  createUser,
  postUsersMeEmailConfirm,
} from '@src/helpers/test';

import initApp from '@src/server';

const emailMocked = jest.spyOn(email, 'sendValidateEmailMessage');
const signMocked = jest.spyOn(jwt, 'sign');

let app: Server;
let password: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/me', () => {
    describe('/updateEmail', () => {
      describe('/confirm', () => {
        describe('POST', () => {
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
              const jsonwebtoken = signAuthToken(user);
              token = jsonwebtoken.token;
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
            it('send an email and sign a token', async () => {
              const newEmail = 'user2@email.com';
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  emailTokenVersion: user.emailTokenVersion,
                  id: user.id,
                }));
              const { status } = await postUsersMeEmailConfirm(app, token, {
                body: {
                  email: newEmail,
                  password,
                },
                confirmToken: 'Bearer token',
              });
              expect(status).toBe(204);
              expect(signMocked)
                .toHaveBeenCalledTimes(1);
              expect(emailMocked)
                .toBeCalledWith(newEmail, expect.any(String));
              expect(emailMocked)
                .toHaveBeenCalledTimes(1);
            });
            it('should increment emailTokenVersion and updateEmailTokenVersion', async () => {
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  emailTokenVersion: user.emailTokenVersion,
                  id: user.id,
                }));
              await postUsersMeEmailConfirm(app, token, {
                body: {
                  email: 'user2@email.com',
                  password,
                },
                confirmToken: 'Bearer token',
              });
              const {
                emailTokenVersion,
                updatedEmailTokenVersion,
              } = user;
              await user.reload();
              expect(user.emailTokenVersion)
                .toBe(emailTokenVersion + 1);
              expect(user.updatedEmailTokenVersion)
                .toBe(updatedEmailTokenVersion + 1);
            });
            it('should trim req email and password', async () => {
              const newEmail = 'user2@email.com';
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: user.id,
                  emailTokenVersion: user.emailTokenVersion,
                }));
              await postUsersMeEmailConfirm(app, token, {
                body: {
                  email: ` ${newEmail} `,
                  password,
                },
                confirmToken: 'Bearer token',
              });
              expect(emailMocked)
                .toBeCalledWith(newEmail, expect.any(String));
            });
          });
          describe('should return 400', () => {
            beforeEach(() => {
              jest.spyOn(verifyConfirmation, 'sendEmailToken')
                .mockImplementationOnce(() => ({
                  OK: true,
                  id: user.id,
                  emailTokenVersion: user.emailTokenVersion,
                }));
            });
            describe('if email', () => {
              it('is not set', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  email: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: '',
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  email: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 1234,
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  email: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is not an email', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'not an email',
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  email: FIELD_SHOULD_BE_AN_EMAIL,
                });
                expect(status).toBe(400);
              });
              it('is the same than the old one', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: user.email,
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  email: 'should be a different one',
                });
                expect(status).toBe(400);
              });
            });
            describe('if password', () => {
              it('is not set', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'user2@email.com',
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  password: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('not match', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'user2@email.com',
                    password: 'wrong password',
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toEqual({
                  password: WRONG_PASSWORD,
                });
                expect(status).toBe(400);
              });
            });
          });
          describe('should return 401 if', () => {
            describe('confirmToken', () => {
              it('is not send', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'user2@email.com',
                    password,
                  },
                });
                expect(errors).toBe(TOKEN_NOT_FOUND);
                expect(status).toBe(401);
              });
              it('is not \'Bearer ...\'', async () => {
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'user2@email.com',
                    password,
                  },
                  confirmToken: 'confirmToken',
                });
                expect(errors).toBe(WRONG_TOKEN);
                expect(status).toBe(401);
              });
              it('is not the correct id', async () => {
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: `${user.id}${user.id}`,
                    emailTokenVersion: user.emailTokenVersion,
                  }));
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'user2@email.com',
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toBe(WRONG_TOKEN_USER_ID);
                expect(status).toBe(401);
              });
              it('has not the correct version', async () => {
                jest.spyOn(verifyConfirmation, 'sendEmailToken')
                  .mockImplementationOnce(() => ({
                    OK: true,
                    id: user.id,
                    emailTokenVersion: user.emailTokenVersion + 1,
                  }));
                const {
                  body: {
                    errors,
                  },
                  status,
                } = await postUsersMeEmailConfirm(app, token, {
                  body: {
                    email: 'user2@email.com',
                    password,
                  },
                  confirmToken: 'Bearer token',
                });
                expect(errors).toBe(WRONG_TOKEN_VERSION);
                expect(status).toBe(401);
              });
            });
          });
        });
      });
    });
  });
});
