import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  BlackList,
  User,
} from '@src/db/models';

import {
  FIELD_SHOULD_BE_A_NUMBER,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postBlackListUser,
  putBlackListsId,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/blackLists', () => {
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
      await cleanGoogleBuckets();
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
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('/:blackListId', () => {
    describe('PUT', () => {
      describe('should return status 200 and', () => {
        it('update blacklist time', async () => {
          const time = (1000 * 60 * 10);
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list reason',
          });
          const {
            body: {
              action,
              data: {
                blackListId: returnedBlackListId,
                time: returnedTime,
                updatedAt,
              },
            },
            status,
          } = await putBlackListsId(app, token, blackListId, {
            body: {
              time,
            },
          });
          const blackList = await BlackList.findByPk(blackListId) as BlackList;
          expect(action).toBe('PUT');
          expect(blackList.time).toBe(time);
          expect(blackList.updatedById).toBe(user.id);
          expect(new Date(updatedAt)).toEqual(blackList.updatedAt);
          expect(returnedBlackListId).toBe(blackListId);
          expect(returnedTime).toBe(time);
          expect(status).toBe(200);
        });
        it('set blackList.time === null', async () => {
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list reason',
            time: (1000 * 60 * 10),
          });
          const {
            body: {
              data: {
                time,
              },
            },
          } = await putBlackListsId(app, token, blackListId);
          const blackList = await BlackList.findByPk(blackListId) as BlackList;
          expect(blackList.time).toBeNull();
          expect(time).toBeNull();
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.blackListId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await putBlackListsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('black list'));
          expect(status).toBe(400);
        });
        it('req.body.time === blackList.time (req.body.time !== null)', async () => {
          const time = (1000 * 60 * 10);
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list reason',
            time,
          });
          const {
            body,
            status,
          } = await putBlackListsId(app, token, blackListId, {
            body: {
              time,
            },
          });
          expect(body.errors).toBe('no change submited');
          expect(status).toBe(400);
        });
        it('req.body.time === blackList.time (req.body.time === null)', async () => {
          const userTwo = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            body: {
              data: {
                blackList: {
                  id: blackListId,
                },
              },
            },
          } = await postBlackListUser(app, token, userTwo.id, {
            reason: 'black list reason',
          });
          const {
            body,
            status,
          } = await putBlackListsId(app, token, blackListId);
          expect(body.errors).toBe('no change submited');
          expect(status).toBe(400);
        });
        describe('time', () => {
          let blackListId: string;

          beforeEach(async (done) => {
            try {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await postBlackListUser(app, token, userTwo.id, {
                reason: 'black list reason',
              });
              blackListId = blackList.id;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('is not a number', async () => {
            const {
              body,
              status,
            } = await putBlackListsId(app, token, blackListId, {
              body: {
                time: 'not a number',
              },
            });
            expect(body.errors).toEqual({
              time: FIELD_SHOULD_BE_A_NUMBER,
            });
            expect(status).toBe(400);
          });
          it('is less than 10 minutes (1000 * 60 * 10)', async () => {
            const {
              body,
              status,
            } = await putBlackListsId(app, token, blackListId, {
              body: {
                time: (1000 * 60 * 10) - 1,
              },
            });
            expect(body.errors).toEqual({
              time: 'should be ban at least 10 minutes',
            });
            expect(status).toBe(400);
          });
          it('is more than 1 year (1000 * 60 * 60 * 24 * 365)', async () => {
            const {
              body,
              status,
            } = await putBlackListsId(app, token, blackListId, {
              body: {
                time: (1000 * 60 * 60 * 24 * 365) + 1,
              },
            });
            expect(body.errors).toEqual({
              time: 'should be ban at most 1 year',
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return status 404 if', () => {
        it('black list does not exist', async () => {
          const {
            body,
            status,
          } = await putBlackListsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
