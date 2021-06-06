import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import {
  FIELD_IS_REQUIRED,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postUsersLogin,
  putUsersIdRole,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      const {
        password,
        user: createdUser,
      } = await createUser({
        role: 'superAdmin',
      });

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

  describe('/role', () => {
    describe('/:id', () => {
      describe('PUT', () => {
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
                  userId: returnedUserId,
                },
              },
              status,
            } = await putUsersIdRole(app, token, userTwo.id, {
              body: {
                role,
              },
            });
            await userTwo.reload();
            expect(action).toBe('PUT');
            expect(returnedRole).toBe(role);
            expect(returnedUserId).toBe(userTwo.id);
            expect(status).toBe(200);
            expect(userTwo.role).toBe(role);
          });
          it('set role to \'superAdmin\'', async () => {
            const role = 'superAdmin';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await putUsersIdRole(app, token, userTwo.id, {
              body: {
                role,
              },
            });
            await userTwo.reload();
            expect(userTwo.role).toBe(role);
          });
          it('set role to \'user\'', async () => {
            const role = 'user';
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              role: 'admin',
              userName: 'user2',
            });
            await putUsersIdRole(app, token, userTwo.id, {
              body: {
                role,
              },
            });
            await userTwo.reload();
            expect(userTwo.role).toBe(role);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
          it(':id and current user.id are the same', async () => {
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, user.id);
            expect(body.errors).toBe('you can\'t modify your role yourself');
            expect(status).toBe(400);
          });
          it('user is already a superAdmin', async () => {
            const {
              user: {
                id,
              },
            } = await createUser({
              email: 'user2@email.com',
              role: 'superAdmin',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, id, {
              body: {
                role: 'user',
              },
            });
            expect(body.errors).toBe('you can\'t modify the role of a super admin');
            expect(status).toBe(400);
          });
          it('user.role === request.body.role', async () => {
            const role = 'user';
            const {
              user: {
                id,
              },
            } = await createUser({
              email: 'user2@email.com',
              role,
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, id, {
              body: {
                role,
              },
            });
            expect(body.errors).toBe(`user's role is already ${role}`);
            expect(status).toBe(400);
          });
          describe('role', () => {
            it('role is not set', async () => {
              const {
                user: {
                  id,
                },
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await putUsersIdRole(app, token, id);
              expect(body.errors).toEqual({
                role: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is admin/superAdmin/user', async () => {
              const {
                user: {
                  id,
                },
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await putUsersIdRole(app, token, id, {
                body: {
                  role: 'wrongRole',
                },
              });
              expect(body.errors).toEqual({
                role: 'role should only be admin, superAdmin or user',
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user is not found', async () => {
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, uuidv4(), {
              body: {
                role: 'superAdmin',
              },
            });
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
          it('user :id is not confirmed', async () => {
            const {
              user: {
                id,
              },
            } = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await putUsersIdRole(app, token, id, {
              body: {
                role: 'superAdmin',
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
