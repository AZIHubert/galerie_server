import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  INVALID_UUID,
  WRONG_PASSWORD,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  cleanGoogleBuckets,
  createUser,
  putUsersIdRole,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let password: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/:userId', () => {
    describe('/role', () => {
      describe('PUT', () => {
        beforeAll(() => {
          sequelize = initSequelize();
          app = initApp();
        });

        beforeEach(async (done) => {
          mockDate.reset();
          try {
            await cleanGoogleBuckets();
            await sequelize.sync({ force: true });
            const {
              password: createdPassword,
              user: createdUser,
            } = await createUser({
              role: 'superAdmin',
            });
            password = createdPassword;
            user = createdUser;
            const jwt = signAuthToken(user);
            token = jwt.token;
          } catch (err) {
            done(err);
          }
          done();
        });

        afterAll(async (done) => {
          mockDate.reset();
          try {
            await cleanGoogleBuckets();
            await sequelize.sync({ force: true });
            await sequelize.close();
          } catch (err) {
            done(err);
          }
          app.close();
          done();
        });

        describe('should return status 200 and', () => {
          it('set role to \'admin\'', async () => {
            const role = 'admin';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                action,
                data: {
                  role: returnedRole,
                  userId,
                },
              },
              status,
            } = await putUsersIdRole(app, token, userTwo.id, {
              body: {
                password,
                role,
              },
            });
            await userTwo.reload();
            expect(action).toBe('PUT');
            expect(returnedRole).toBe(role);
            expect(status).toBe(200);
            expect(userId).toBe(userTwo.id);
            expect(userTwo.role).toBe(role);
          });
          it('set role to \'superAdmin\'', async () => {
            const role = 'superAdmin';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                action,
                data: {
                  role: returnedRole,
                  userId,
                },
              },
              status,
            } = await putUsersIdRole(app, token, userTwo.id, {
              body: {
                password,
                role,
              },
            });
            await userTwo.reload();
            expect(action).toBe('PUT');
            expect(returnedRole).toBe(role);
            expect(status).toBe(200);
            expect(userId).toBe(userTwo.id);
            expect(userTwo.role).toBe(role);
          });
          it('set role to \'user\'', async () => {
            const role = 'user';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              role: 'admin',
              userName: 'user2',
            });
            const {
              body: {
                action,
                data: {
                  role: returnedRole,
                  userId,
                },
              },
              status,
            } = await putUsersIdRole(app, token, userTwo.id, {
              body: {
                password,
                role,
              },
            });
            await userTwo.reload();
            expect(action).toBe('PUT');
            expect(returnedRole).toBe(role);
            expect(status).toBe(200);
            expect(userId).toBe(userTwo.id);
            expect(userTwo.role).toBe(role);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
          it('user.role === \'superAdmin\'', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              role: 'superAdmin',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, userTwo.id, {
              body: {
                password,
                role: 'user',
              },
            });
            expect(body.errors).toBe('you cannot update the role of a superAdmin');
            expect(status).toBe(400);
          });
          describe('req.body', () => {
            let userTwo: User;

            beforeEach(async (done) => {
              try {
                const { user: createdUser } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                userTwo = createdUser;
              } catch (err) {
                done(err);
              }
              done();
            });

            describe('.password', () => {
              it('is not send', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    role: 'admin',
                  },
                });
                expect(body.errors).toEqual({
                  password: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    password: 1234,
                    role: 'admin',
                  },
                });
                expect(body.errors).toEqual({
                  password: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is an empty string', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    password: '',
                    role: 'admin',
                  },
                });
                expect(body.errors).toEqual({
                  password: FIELD_CANNOT_BE_EMPTY,
                });
                expect(status).toBe(400);
              });
              it('do not match user.password', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    password: `a${password}`,
                    role: 'admin',
                  },
                });
                expect(body.errors).toEqual({
                  password: WRONG_PASSWORD,
                });
                expect(status).toBe(400);
              });
            });
            describe('.role', () => {
              it('is not send', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    password,
                  },
                });
                expect(body.errors).toEqual({
                  role: FIELD_IS_REQUIRED,
                });
                expect(status).toBe(400);
              });
              it('is not a string', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    role: 1234,
                    password,
                  },
                });
                expect(body.errors).toEqual({
                  role: FIELD_SHOULD_BE_A_STRING,
                });
                expect(status).toBe(400);
              });
              it('is not \'admin\'/\'superAdmin\'/\'user\'', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    role: 'wrongRole',
                    password,
                  },
                });
                expect(body.errors).toEqual({
                  role: 'role should be \'admin\', \'superAdmin\' or \'user\'',
                });
                expect(status).toBe(400);
              });
              it('=== user.role', async () => {
                const {
                  body,
                  status,
                } = await putUsersIdRole(app, token, userTwo.id, {
                  body: {
                    role: userTwo.role,
                    password,
                  },
                });
                expect(body.errors).toEqual({
                  role: 'role should be different has the actual one',
                });
                expect(status).toBe(400);
              });
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, uuidv4(), {
              body: {
                role: 'user',
                password,
              },
            });
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
