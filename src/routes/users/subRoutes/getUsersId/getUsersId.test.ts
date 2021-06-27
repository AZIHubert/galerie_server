import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createBlackList,
  createUser,
  getUsersId,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

jest.mock('@src/helpers/signedUrl', () => jest.fn());

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/id', () => {
    describe('/:userId', () => {
      beforeAll(() => {
        app = initApp();
        sequelize = initSequelize();
      });

      beforeEach(async (done) => {
        try {
          await sequelize.sync({ force: true });
          const {
            user: createdUser,
          } = await createUser({});
          user = createdUser;
          const jwt = signAuthToken(user);
          token = jwt.token;
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
      describe('GET', () => {
        describe('shouls return status 200 and', () => {
          it('return user', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                action,
                data: {
                  user: returnedUser,
                },
              },
              status,
            } = await getUsersId(app, token, userTwo.id);
            expect(action).toBe('GET');
            expect(returnedUser.hasNewNotifications).toBeUndefined();
            expect(status).toBe(200);
            testUser(returnedUser, userTwo);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getUsersId(app, token, '100');
            expect(body.errors).toEqual(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
          it('params.userId is the same as the current user.id', async () => {
            const {
              body,
              status,
            } = await getUsersId(app, token, user.id);
            expect(body.errors).toEqual('params.id cannot be the same as your current one');
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await getUsersId(app, token, uuidv4());
            expect(status).toBe(404);
            expect(body).toEqual({
              errors: MODEL_NOT_FOUND('user'),
            });
          });
          it('user is not confirmed', async () => {
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
            } = await getUsersId(app, token, id);
            expect(status).toBe(404);
            expect(body).toEqual({
              errors: MODEL_NOT_FOUND('user'),
            });
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
            } = await getUsersId(app, token, userTwo.id);
            expect(status).toBe(404);
            expect(body).toEqual({
              errors: MODEL_NOT_FOUND('user'),
            });
          });
        });
      });
    });
  });
});
