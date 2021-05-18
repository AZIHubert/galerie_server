import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  login,
  putPseudonym,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

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
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
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
            } = await putPseudonym(app, token, {
              pseudonym,
            });
            expect(action).toBe('PUT');
            expect(data).toEqual({ pseudonym });
            expect(status).toBe(200);
          });
          it('update user\'s pseudonym', async () => {
            await putPseudonym(app, token, {
              pseudonym,
            });
            const { pseudonym: newPseudonym } = await user.reload();
            expect(newPseudonym).toBe(pseudonym);
          });
          it('trim pseudonym', async () => {
            const {
              body: {
                data,
              },
            } = await putPseudonym(app, token, {
              pseudonym: ` ${pseudonym} `,
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
              } = await putPseudonym(app, token, {});
              expect(body.errors).toEqual({
                pseudonym: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await putPseudonym(app, token, {
                pseudonym: '',
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_IS_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await putPseudonym(app, token, {
                pseudonym: 1234,
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_NOT_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is less than 3 characters', async () => {
              const {
                body,
                status,
              } = await putPseudonym(app, token, {
                pseudonym: 'a'.repeat(2),
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_MIN_LENGTH_OF_THREE,
              });
              expect(status).toBe(400);
            });
            it('is more than 30 characters', async () => {
              const {
                body,
                status,
              } = await putPseudonym(app, token, {
                pseudonym: 'a'.repeat(31),
              });
              expect(body.errors).toEqual({
                pseudonym: FIELD_MAX_LENGTH_THRITY,
              });
              expect(status).toBe(400);
            });
          });
        });
      });
    });
  });
});
