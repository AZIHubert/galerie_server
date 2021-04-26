import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import { USER_NOT_FOUND } from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteBlacklist,
  login,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/users', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      await cleanGoogleBuckets();
      user = await createUser({
        role: 'superAdmin',
      });
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
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/blacklist', () => {
    describe('/:id', () => {
      describe('DELETE', () => {
        describe('it should return status 200 and', () => {
          let userId: string;
          let blacklistId: string;
          beforeEach(async (done) => {
            try {
              const blacklistedUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              userId = blacklistedUser.id;
              const blacklist = await BlackList.create({
                adminId: user.id,
                reason: 'black list reason',
                userId,
              });
              blacklistId = blacklist.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('return action', async () => {
            const {
              body: {
                action,
              },
              status,
            } = await deleteBlacklist(app, token, userId);
            expect(action).toBe('DELETE');
            expect(status).toBe(200);
          });
          it('delete blacklist', async () => {
            await deleteBlacklist(app, token, userId);
            const blacklist = await BlackList.findByPk(blacklistId);
            expect(blacklist).toBeNull();
          });
        });
        describe('it should return status 401 if', () => {
          it('user is not blacklisted', async () => {
            const { id: userId } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await deleteBlacklist(app, token, userId);
            expect(body.errors).toBe('user is not black listed');
            expect(status).toBe(401);
          });
        });
        describe('it should return status 404 if', () => {
          it('user doesn\'t exist', async () => {
            const {
              body,
              status,
            } = await deleteBlacklist(app, token, '100');
            expect(body.errors).toBe(USER_NOT_FOUND);
            expect(status).toBe(404);
          });
          it('user is not confirmed', async () => {
            const { id: userId } = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await deleteBlacklist(app, token, userId);
            expect(body.errors).toBe(USER_NOT_FOUND);
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
