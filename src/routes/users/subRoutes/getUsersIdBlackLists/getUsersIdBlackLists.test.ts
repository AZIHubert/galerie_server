import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBlackList,
  createUser,
  getUsersIdBlackLists,
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
      describe('GET', () => {
        beforeAll(() => {
          sequelize = initSequelize();
          app = initApp();
        });

        beforeEach(async (done) => {
          try {
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

          it('return no blackList', async () => {
            const {
              body: {
                action,
                data: {
                  userId,
                  blackLists,
                },
              },
              status,
            } = await getUsersIdBlackLists(app, token, userTwo.id);
            expect(action).toBe('GET');
            expect(userId).toBe(userTwo.id);
            expect(blackLists.length).toBe(0);
            expect(status).toBe(200);
          });
          it('return one blackList', async () => {
            await createBlackList({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getUsersIdBlackLists(app, token, userTwo.id);
            expect(blackLists.length).toBe(1);
            expect(blackLists[0].createdBy).toBeNull();
            expect(blackLists[0].updatedBy).toBeNull();
            testBlackList(blackLists[0]);
          });
          it('return a pack of 20 blackLists', async () => {
            const NUM = 21;
            const numOfBlackLists = new Array(NUM).fill(0);
            await Promise.all(
              numOfBlackLists.map(async () => {
                await createBlackList({
                  userId: userTwo.id,
                });
              }),
            );
            const {
              body: {
                data: {
                  blackLists: firstPack,
                },
              },
            } = await getUsersIdBlackLists(app, token, userTwo.id);
            const {
              body: {
                data: {
                  blackLists: secondPack,
                },
              },
            } = await getUsersIdBlackLists(app, token, userTwo.id, {
              previousBlackList: firstPack[firstPack.length - 1].autoIncrementId,
            });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('order blackLists by createdAt (DESC)', async () => {
            const blackListOne = await createBlackList({
              userId: userTwo.id,
            });
            const blackListTwo = await createBlackList({
              userId: userTwo.id,
            });
            const blackListThree = await createBlackList({
              userId: userTwo.id,
            });
            const blackListFour = await createBlackList({
              userId: userTwo.id,
            });
            const blackListFive = await createBlackList({
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getUsersIdBlackLists(app, token, userTwo.id);
            expect(blackLists.length).toBe(5);
            expect(blackLists[0].id).toBe(blackListFive.id);
            expect(blackLists[1].id).toBe(blackListFour.id);
            expect(blackLists[2].id).toBe(blackListThree.id);
            expect(blackLists[3].id).toBe(blackListTwo.id);
            expect(blackLists[4].id).toBe(blackListOne.id);
          });
          it('include createdBy', async () => {
            await createBlackList({
              createdById: user.id,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists: [{
                    createdBy,
                  }],
                },
              },
            } = await getUsersIdBlackLists(app, token, userTwo.id);
            expect(createdBy.hasNewNotifications).toBeUndefined();
            testUser(createdBy, user);
          });
          it('include updatedBy', async () => {
            await createBlackList({
              updatedById: user.id,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists: [{
                    updatedBy,
                  }],
                },
              },
            } = await getUsersIdBlackLists(app, token, userTwo.id);
            expect(updatedBy.hasNewNotifications).toBeUndefined();
            testUser(updatedBy, user);
          });
          describe('should return first blackLists if req.query.previousBlackList', () => {
            let blackListId: string;

            beforeEach(async (done) => {
              try {
                await createBlackList({
                  updatedById: user.id,
                  userId: userTwo.id,
                });
                const blackList = await createBlackList({
                  updatedById: user.id,
                  userId: userTwo.id,
                });
                blackListId = blackList.id;
              } catch (err) {
                done(err);
              }
              done();
            });

            it('is not a number', async () => {
              const {
                body: {
                  data: {
                    blackLists,
                  },
                },
              } = await getUsersIdBlackLists(app, token, userTwo.id, {
                previousBlackList: 'notANumber',
              });
              expect(blackLists.length).toBe(2);
              expect(blackLists[0].id).toBe(blackListId);
            });
            it('is less than 0', async () => {
              const {
                body: {
                  data: {
                    blackLists,
                  },
                },
              } = await getUsersIdBlackLists(app, token, userTwo.id, {
                previousBlackList: '-1',
              });
              expect(blackLists.length).toBe(2);
              expect(blackLists[0].id).toBe(blackListId);
            });
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await getUsersIdBlackLists(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await getUsersIdBlackLists(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
