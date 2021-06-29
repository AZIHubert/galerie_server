import { Server } from 'http';
import { sign } from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import { User } from '#src/db/models';

import accEnv from '#src/helpers/accEnv';
import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_ALREADY_TAKEN,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_AN_EMAIL,
  INVALID_UUID,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_USER_ID,
  WRONG_TOKEN_VERSION,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createUser,
  putUsersMeEmail,
} from '#src/helpers/test';

import initApp from '#src/server';

const UPDATE_EMAIL_SECRET = accEnv('UPDATE_EMAIL_SECRET');
let app: Server;
let password: string;
let sequelize: Sequelize;
let updatedEmail: string;
let user: User;
let token: string;
let wrightToken: string;

describe('/users', () => {
  describe('/me', () => {
    describe('/email', () => {
      describe('put', () => {
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
            const jwt = signAuthToken(user);
            token = jwt.token;
            updatedEmail = `new${user.email}`;
            wrightToken = sign(
              {
                id: user.id,
                updatedEmail,
                updatedEmailTokenVersion: user.updatedEmailTokenVersion,
              },
              UPDATE_EMAIL_SECRET,
              {
                expiresIn: '2d',
              },
            );
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
          it('return token', async () => {
            const {
              body: {
                data: {
                  expiresIn,
                  token: returnedToken,
                },
              },
              status,
            } = await putUsersMeEmail(app, token, {
              body: {
                password,
              },
              confirmToken: `Bearer ${wrightToken}`,
            });
            expect(expiresIn).toBe(1800);
            expect(returnedToken).not.toBeUndefined();
            expect(status).toBe(200);
          });
          it('increment updatedEmailTokenVersion and authToken', async () => {
            await putUsersMeEmail(app, token, {
              body: {
                password,
              },
              confirmToken: `Bearer ${wrightToken}`,
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
            await putUsersMeEmail(app, token, {
              body: {
                password,
              },
              confirmToken: `Bearer ${wrightToken}`,
            });
            const { email } = await user.reload();
            expect(email).toBe(updatedEmail);
          });
          it('trim email', async () => {
            const trimWringToken = sign(
              {
                id: user.id,
                updatedEmail: ` ${updatedEmail} `,
                updatedEmailTokenVersion: user.updatedEmailTokenVersion,
              },
              UPDATE_EMAIL_SECRET,
              {
                expiresIn: '2d',
              },
            );
            await putUsersMeEmail(app, token, {
              body: {
                password,
              },
              confirmToken: `Bearer ${trimWringToken}`,
            });
            const { email } = await user.reload();
            expect(email).toBe(updatedEmail);
          });
        });
        describe('should return status 400 if', () => {
          describe('password', () => {
            it('confirmPassword.id is not a UUIDv4', async () => {
              const wrongToken = sign(
                {
                  id: '100',
                  updatedEmail,
                  updatedEmailTokenVersion: user.updatedEmailTokenVersion + 1,
                },
                UPDATE_EMAIL_SECRET,
                {
                  expiresIn: '2d',
                },
              );
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, {
                confirmToken: `Bearer ${wrongToken}`,
              });
              expect(body.errors).toBe(`confirmation token error: ${INVALID_UUID('user')}`);
              expect(status).toBe(400);
            });
            it('is not send', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, {
                confirmToken: `Bearer ${wrightToken}`,
              });
              expect(body.errors).toEqual({
                password: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, {
                body: {
                  password: '',
                },
                confirmToken: `Bearer ${wrightToken}`,
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
              } = await putUsersMeEmail(app, token, {
                body: {
                  password: 1234,
                },
                confirmToken: `Bearer ${wrightToken}`,
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
              } = await putUsersMeEmail(app, token, {
                body: {
                  password: 'wrong password',
                },
                confirmToken: `Bearer ${wrightToken}`,
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
              } = await putUsersMeEmail(app, token, {
                body: {
                  password,
                },
              });
              expect(body.errors).toBe(TOKEN_NOT_FOUND);
              expect(status).toBe(401);
            });
            it('is not \'Bearer ...\'', async () => {
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, {
                body: {
                  password,
                },
                confirmToken: wrightToken,
              });
              expect(body.errors).toBe(WRONG_TOKEN);
              expect(status).toBe(401);
            });
            it('is not correct version', async () => {
              const wrongToken = sign(
                {
                  id: user.id,
                  updatedEmail,
                  updatedEmailTokenVersion: user.updatedEmailTokenVersion + 1,
                },
                UPDATE_EMAIL_SECRET,
                {
                  expiresIn: '2d',
                },
              );
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, {
                body: {
                  password,
                },
                confirmToken: `Bearer ${wrongToken}`,
              });
              expect(body.errors).toBe(WRONG_TOKEN_VERSION);
              expect(status).toBe(401);
            });
            it('is not correct user', async () => {
              const wrongToken = sign(
                {
                  id: uuidv4(),
                  updatedEmail,
                  updatedEmailTokenVersion: user.updatedEmailTokenVersion + 1,
                },
                UPDATE_EMAIL_SECRET,
                {
                  expiresIn: '2d',
                },
              );
              const {
                body,
                status,
              } = await putUsersMeEmail(app, token, {
                body: {
                  password,
                },
                confirmToken: `Bearer ${wrongToken}`,
              });
              const {
                authTokenVersion,
                updatedEmailTokenVersion,
              } = user;
              await user.reload();
              expect(body.errors).toBe(WRONG_TOKEN_USER_ID);
              expect(status).toBe(401);
              expect(user.authTokenVersion).toBe(authTokenVersion);
              expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion);
            });
            describe('.updatedEmail', () => {
              it('is not set', async () => {
                const wrongToken = sign(
                  {
                    id: user.id,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  },
                  UPDATE_EMAIL_SECRET,
                  {
                    expiresIn: '2d',
                  },
                );
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: `Bearer ${wrongToken}`,
                });
                const {
                  authTokenVersion,
                  updatedEmailTokenVersion,
                } = user;
                await user.reload();
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_IS_REQUIRED}`);
                expect(status).toBe(401);
                expect(user.authTokenVersion).toBe(authTokenVersion + 1);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('is an empty string', async () => {
                const wrongToken = sign(
                  {
                    id: user.id,
                    updatedEmail: '',
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  },
                  UPDATE_EMAIL_SECRET,
                  {
                    expiresIn: '2d',
                  },
                );
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: `Bearer ${wrongToken}`,
                });
                const {
                  authTokenVersion,
                  updatedEmailTokenVersion,
                } = user;
                await user.reload();
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_CANNOT_BE_EMPTY}`);
                expect(status).toBe(401);
                expect(user.authTokenVersion).toBe(authTokenVersion + 1);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('is not a string', async () => {
                const wrongToken = sign(
                  {
                    id: user.id,
                    updatedEmail: 1234,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  },
                  UPDATE_EMAIL_SECRET,
                  {
                    expiresIn: '2d',
                  },
                );
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: `Bearer ${wrongToken}`,
                });
                const {
                  authTokenVersion,
                  updatedEmailTokenVersion,
                } = user;
                await user.reload();
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_SHOULD_BE_A_STRING}`);
                expect(status).toBe(401);
                expect(user.authTokenVersion).toBe(authTokenVersion + 1);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('is not an email', async () => {
                const wrongToken = sign(
                  {
                    id: user.id,
                    updatedEmail: 'notAnEmail',
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  },
                  UPDATE_EMAIL_SECRET,
                  {
                    expiresIn: '2d',
                  },
                );
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: `Bearer ${wrongToken}`,
                });
                const {
                  authTokenVersion,
                  updatedEmailTokenVersion,
                } = user;
                await user.reload();
                expect(body.errors).toBe(`${WRONG_TOKEN}: email ${FIELD_SHOULD_BE_AN_EMAIL}`);
                expect(status).toBe(401);
                expect(user.authTokenVersion).toBe(authTokenVersion + 1);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('is the same has the old one', async () => {
                const wrongToken = sign(
                  {
                    id: user.id,
                    updatedEmail: user.email,
                    updatedEmailTokenVersion: user.updatedEmailTokenVersion,
                  },
                  UPDATE_EMAIL_SECRET,
                  {
                    expiresIn: '2d',
                  },
                );
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: `Bearer ${wrongToken}`,
                });
                const {
                  authTokenVersion,
                  updatedEmailTokenVersion,
                } = user;
                await user.reload();
                expect(body.errors).toBe(`${WRONG_TOKEN}: email should be different`);
                expect(status).toBe(401);
                expect(user.authTokenVersion).toBe(authTokenVersion + 1);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
              it('is already used', async () => {
                await createUser({
                  email: updatedEmail,
                  userName: 'user2',
                });
                const {
                  body,
                  status,
                } = await putUsersMeEmail(app, token, {
                  body: {
                    password,
                  },
                  confirmToken: `Bearer ${wrightToken}`,
                });
                const {
                  authTokenVersion,
                  updatedEmailTokenVersion,
                } = user;
                await user.reload();
                expect(body.errors).toBe(`${WRONG_TOKEN}: ${FIELD_IS_ALREADY_TAKEN}`);
                expect(status).toBe(401);
                expect(user.authTokenVersion).toBe(authTokenVersion + 1);
                expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
              });
            });
          });
        });
      });
    });
  });
});
