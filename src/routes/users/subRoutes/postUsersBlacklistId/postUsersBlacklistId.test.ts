import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_NOT_A_NUMBER,
  FIELD_NOT_A_STRING,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  login,
  postBlackListUser,
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
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/blackList', () => {
    describe('/:id', () => {
      describe('POST', () => {
        describe('should return status 200 and', () => {
          it('black list an user and set is role to user', async () => {
            const reason = 'black list reason';
            const secondUser = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                action,
                data: {
                  blackList,
                },
              },
              status,
            } = await postBlackListUser(app, token, secondUser.id, {
              reason,
            });
            const blackLists = await BlackList.findAll();
            expect(action).toBe('POST');
            expect(blackList.adminId).toBe(user.id);
            expect(blackList.createdAt).toBeTruthy();
            expect(blackList.id).toBeTruthy();
            expect(blackList.reason).toBe(reason);
            expect(blackList.time).toBeNull();
            expect(blackList.updatedAt).toBeUndefined();
            expect(blackList.userId).toBe(secondUser.id);
            expect(blackLists.length).toBe(1);
            expect(status).toBe(200);
          });
          it('trim reason', async () => {
            const reason = 'black list reason';
            const secondUser = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                data: {
                  blackList,
                },
              },
            } = await postBlackListUser(app, token, secondUser.id, {
              reason: ` ${reason} `,
            });
            expect(blackList.reason).toBe(reason);
          });
          it('black list a user with a time', async () => {
            const time = 1000 * 60 * 10;
            const secondUser = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                data: {
                  blackList,
                },
              },
            } = await postBlackListUser(app, token, secondUser.id, {
              reason: 'black list reason',
              time,
            });
            expect(blackList.time).toBe(time);
          });
        });
        describe('should return status 400 if', () => {
          it('user is already black listed', async () => {
            const secondUser = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await BlackList.create({
              adminId: user.id,
              reason: 'black list reason',
              userId: secondUser.id,
            });
            const {
              body,
              status,
            } = await postBlackListUser(app, token, secondUser.id, {
              reason: 'black list reason',
            });
            expect(body.errors).toBe('user is already black listed');
            expect(status).toBe(400);
          });
          describe('reason', () => {
            it('is not send', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {});
              expect(body.errors).toEqual({
                reason: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: '',
              });
              expect(body.errors).toEqual({
                reason: FIELD_IS_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: 1234,
              });
              expect(body.errors).toEqual({
                reason: FIELD_NOT_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is less than 10 characters', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: 'a'.repeat(9),
              });
              expect(body.errors).toEqual({
                reason: FIELD_MIN_LENGTH_OF_TEN,
              });
              expect(status).toBe(400);
            });
            it('is more than 200 characters', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: 'a'.repeat(201),
              });
              expect(body.errors).toEqual({
                reason: FIELD_MAX_LENGTH_TWO_HUNDRER,
              });
              expect(status).toBe(400);
            });
          });
          describe('time', () => {
            it('is not a number', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: 'black list reason',
                time: 'time',
              });
              expect(body.errors).toEqual({
                time: FIELD_NOT_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less than 10mn', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: 'black list reason',
                time: 1000 * 60 * 9,
              });
              expect(body.errors).toEqual({
                time: 'should be ban at least 10mn',
              });
              expect(status).toBe(400);
            });
            it('is more than 1 year', async () => {
              const secondUser = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await postBlackListUser(app, token, secondUser.id, {
                reason: 'black list reason',
                time: 1000 * 60 * 60 * 24 * 365 * 2,
              });
              expect(body.errors).toEqual({
                time: 'should be ban at most 1 year',
              });
              expect(status).toBe(400);
            });
          });
        });
        describe('should return status 401 if', () => {
          it('user.id and :id are the same', async () => {
            const {
              body,
              status,
            } = await postBlackListUser(app, token, user.id, {
              reason: 'black list reason',
            });
            expect(body.errors).toBe('you can\'t put your account on the black list');
            expect(status).toBe(401);
          });
          it('user\'srole is superAmin', async () => {
            const secondUser = await createUser({
              email: 'user2@email.com',
              role: 'superAdmin',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postBlackListUser(app, token, secondUser.id, {
              reason: 'black list reason',
            });
            expect(body.errors).toBe('you can\'t black listed a super admin');
            expect(status).toBe(401);
          });
          it('current user\'s role is admin and user\'s role is admin', async () => {
            const secondUser = await createUser({
              email: 'user2@email.com',
              role: 'admin',
              userName: 'user2',
            });
            const {
              body: {
                token: tokenTwo,
              },
            } = await login(app, secondUser.email, userPassword);
            const thirdUser = await createUser({
              email: 'user3@email.com',
              role: 'admin',
              userName: 'user3',
            });
            const {
              body,
              status,
            } = await postBlackListUser(app, tokenTwo, thirdUser.id, {
              reason: 'black list reason',
            });
            expect(body.errors).toBe('you can\'t black listed an admin');
            expect(status).toBe(401);
          });
        });
        describe('should return status 404 if', () => {
          it('user :id is not confirmed', async () => {
            const secondUser = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postBlackListUser(app, token, secondUser.id, {
              reason: 'black list reason',
            });
            expect(body.errors).toBe(USER_NOT_FOUND);
            expect(status).toBe(404);
          });
          it('user :id not found', async () => {
            const {
              body,
              status,
            } = await postBlackListUser(app, token, '2', {
              reason: 'black list reason',
            });
            expect(body.errors).toBe(USER_NOT_FOUND);
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
