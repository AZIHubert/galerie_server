import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  postUsersLogin,
  putUsersMePseudonym,
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
      } = await createUser({});

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
    describe('/pseudonym', () => {
      describe('PUT', () => {
        describe('should return status 200 and', () => {
          const pseudonym = 'new pseudonym';
          it('return action and pseudonym', async () => {
            const {
              body: {
                action,
                data,
              },
              status,
            } = await putUsersMePseudonym(app, token, {
              body: {
                pseudonym,
              },
            });
            expect(action).toBe('PUT');
            expect(data).toEqual({ pseudonym });
            expect(status).toBe(200);
          });
          it('update user\'s pseudonym', async () => {
            await putUsersMePseudonym(app, token, {
              body: {
                pseudonym,
              },
            });
            const { pseudonym: newPseudonym } = await user.reload();
            expect(newPseudonym).toBe(pseudonym);
          });
          it('trim pseudonym', async () => {
            const {
              body: {
                data,
              },
            } = await putUsersMePseudonym(app, token, {
              body: {
                pseudonym: ` ${pseudonym} `,
              },
            });
            const { pseudonym: newPseudonym } = await user.reload();
            expect(data).toEqual({ pseudonym });
            expect(newPseudonym).toBe(pseudonym);
          });
        });
        describe('should return status 400 if', () => {
          describe('pseudonym', () => {
            it('is not send', async () => {
              const {
                body,
                status,
              } = await putUsersMePseudonym(app, token);
              expect(body.errors).toEqual({
                pseudonym: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await putUsersMePseudonym(app, token, {
                body: {
                  pseudonym: '',
                },
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await putUsersMePseudonym(app, token, {
                body: {
                  pseudonym: 1234,
                },
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is less than 3 characters', async () => {
              const {
                body,
                status,
              } = await putUsersMePseudonym(app, token, {
                body: {
                  pseudonym: 'a'.repeat(2),
                },
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_MIN_LENGTH(3),
              });
              expect(status).toBe(400);
            });
            it('is more than 30 characters', async () => {
              const {
                body,
                status,
              } = await putUsersMePseudonym(app, token, {
                body: {
                  pseudonym: 'a'.repeat(31),
                },
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_MAX_LENGTH(30),
              });
              expect(status).toBe(400);
            });
          });
        });
      });
    });
  });
});
