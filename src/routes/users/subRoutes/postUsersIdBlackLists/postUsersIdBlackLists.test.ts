import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  BlackList,
  User,
} from '#src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
  FIELD_SHOULD_BE_A_NUMBER,
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  cleanGoogleBuckets,
  createUser,
  postUsersIdBlackLists,
  testBlackList,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/:userId', () => {
    describe('/blackLists', () => {
      describe('POST', () => {
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
              user: createdUser,
            } = await createUser({
              role: 'admin',
            });
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
          let userTwo: User;

          beforeEach(async (done) => {
            try {
              const {
                user: createdUser,
              } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              userTwo = createdUser;
            } catch (err) {
              done(err);
            }
            done();
          });

          it('create black list without time', async () => {
            const reason = 'black list reason';
            const {
              body: {
                action,
                data: {
                  blackList: returnedBlackList,
                },
              },
              status,
            } = await postUsersIdBlackLists(app, token, userTwo.id, {
              body: {
                reason,
              },
            });
            const blackList = await BlackList.findOne({
              where: {
                createdById: user.id,
                userId: userTwo.id,
              },
            });
            expect(action).toBe('POST');
            expect(blackList).not.toBeNull();
            expect(returnedBlackList.createdById).toBeUndefined();
            expect(returnedBlackList.active).toBe(true);
            expect(returnedBlackList.createdAt).not.toBeUndefined();
            expect(returnedBlackList.id).not.toBeUndefined();
            expect(returnedBlackList.reason).toBe(reason);
            expect(returnedBlackList.time).toBeNull();
            expect(returnedBlackList.updatedAt).not.toBeUndefined();
            expect(returnedBlackList.updatedById).toBeUndefined();
            expect(returnedBlackList.updatedBy).toBeNull();
            expect(returnedBlackList.userId).toBeUndefined();
            expect(status).toBe(200);
            testBlackList(returnedBlackList);
            testUser(returnedBlackList.createdBy);
          });
          it('post black list with a time', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            const {
              body: {
                data: {
                  blackList,
                },
              },
            } = await postUsersIdBlackLists(app, token, userTwo.id, {
              body: {
                reason: 'black list reason',
                time,
              },
            });
            expect(new Date(blackList.time)).toEqual(new Date(timeStamp + time));
          });
          it('trim reason', async () => {
            const reason = 'black list reason';
            const {
              body: {
                data: {
                  blackList: {
                    reason: returnedReason,
                  },
                },
              },
            } = await postUsersIdBlackLists(app, token, userTwo.id, {
              body: {
                reason: ` ${reason} `,
              },
            });
            expect(returnedReason).toBe(reason);
          });
          it('set user.isBlackListed', async () => {
            const timeStamp = 1434319925275;
            mockDate.set(timeStamp);
            await postUsersIdBlackLists(app, token, userTwo.id, {
              body: {
                reason: 'blackList reason',
              },
            });
            await userTwo.reload();
            expect(userTwo.isBlackListed).toBe(true);
          });
          it('black list an moderator if current user role is admin', async () => {
            const {
              user: userThree,
            } = await createUser({
              email: 'user3@email.com',
              role: 'moderator',
              userName: 'user3',
            });
            const {
              status,
            } = await postUsersIdBlackLists(app, token, userThree.id, {
              body: {
                reason: 'black list reason',
              },
            });
            expect(status).toBe(200);
          });
        });
        describe('should return status 400 if', () => {
          it('req.params.userId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await postUsersIdBlackLists(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
          it('current user.id === :userId', async () => {
            const {
              body,
              status,
            } = await postUsersIdBlackLists(app, token, user.id);
            expect(body.errors).toBe('you can\'t put your own account on the black list');
            expect(status).toBe(400);
          });
          it('user.role === \'admin\'', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              role: 'admin',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postUsersIdBlackLists(app, token, userTwo.id);
            expect(body.errors).toBe('you can\'t black list a admin');
            expect(status).toBe(400);
          });
          it('current user.role === \'moderator\' and user.role === \'moderator\'', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              role: 'moderator',
              userName: 'user2',
            });
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              role: 'moderator',
              userName: 'user3',
            });
            const { token: tokenTwo } = signAuthToken(userTwo);
            const {
              body,
              status,
            } = await postUsersIdBlackLists(app, tokenTwo, userThree.id);
            expect(body.errors).toBe('you can\'t black list an moderator');
            expect(status).toBe(400);
          });
          describe('reason', () => {
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

            it('is not send', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id);
              expect(body.errors).toEqual({
                reason: FIELD_IS_REQUIRED,
              });
              expect(status).toBe(400);
            });
            it('is not a string', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: 1234,
                },
              });
              expect(body.errors).toEqual({
                reason: FIELD_SHOULD_BE_A_STRING,
              });
              expect(status).toBe(400);
            });
            it('is an empty string', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: '',
                },
              });
              expect(body.errors).toEqual({
                reason: FIELD_CANNOT_BE_EMPTY,
              });
              expect(status).toBe(400);
            });
            it('has less than 10 characters', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: 'a'.repeat(9),
                },
              });
              expect(body.errors).toEqual({
                reason: FIELD_MIN_LENGTH(10),
              });
              expect(status).toBe(400);
            });
            it('has more than 200 characters', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: 'a'.repeat(201),
                },
              });
              expect(body.errors).toEqual({
                reason: FIELD_MAX_LENGTH(200),
              });
              expect(status).toBe(400);
            });
          });
          describe('time', () => {
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

            it('is not a number', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: 'black list reason',
                  time: 'not a number',
                },
              });
              expect(body.errors).toEqual({
                time: FIELD_SHOULD_BE_A_NUMBER,
              });
              expect(status).toBe(400);
            });
            it('is less thans 10 minutes (1000 * 60 * 10)', async () => {
              const {
                body,
                status,
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: 'black list reason',
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
              } = await postUsersIdBlackLists(app, token, userTwo.id, {
                body: {
                  reason: 'black list reason',
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
          it('user not found', async () => {
            const {
              body,
              status,
            } = await postUsersIdBlackLists(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
          it('user is not confirmed', async () => {
            const { user: userTwo } = await createUser({
              confirmed: false,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await postUsersIdBlackLists(app, token, userTwo.id, {
              body: {
                reason: 'black list reason',
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
