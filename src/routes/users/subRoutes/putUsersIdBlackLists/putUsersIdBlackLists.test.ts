import { Server } from 'http';
import mockDate from 'mockdate';
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
  cleanGoogleBuckets,
  createBlackList,
  createUser,
  putUsersIdBlackListsId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/users', () => {
  describe('/:userId', () => {
    describe('/blackLists', () => {
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

          it('set user.isBlackListed === false', async () => {
            await createBlackList({
              userId: userTwo.id,
            });
            const {
              body: {
                action,
                data: {
                  userId,
                },
              },
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            await userTwo.reload();
            expect(action).toBe('PUT');
            expect(status).toBe(200);
            expect(userId).toBe(userTwo.id);
            expect(userTwo.isBlackListed).toBe(false);
          });
          it('set user.isBlackListed === false if one of his non last created blackList is expired, but not the last one', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            await createBlackList({
              time,
              userId: userTwo.id,
            });
            mockDate.set(timeStamp + 1);
            await createBlackList({
              userId: userTwo.id,
            });
            mockDate.set(timeStamp + time + 1);
            const {
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            expect(status).toBe(200);
          });
          it('set user.isBlackListed === false if currentUser.role \'admin\' and one of his non last created blackList was created by a \'superAdmin\', but not the last one', async () => {
            const { user: admin } = await createUser({
              email: 'user3@email.com',
              role: 'superAdmin',
              userName: 'user3',
            });
            await createBlackList({
              createdById: admin.id,
              userId: userTwo.id,
            });
            await createBlackList({
              userId: userTwo.id,
            });
            const {
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            expect(status).toBe(200);
          });
          it('set user.isBlackListed === false if the last created blackList.createdBy.role === \'superAdmin\' and currentUser.role === \'superAdmin\'', async () => {
            const { user: superAdminOne } = await createUser({
              email: 'superAdmin1@email.com',
              role: 'superAdmin',
              userName: 'superAdmin1',
            });
            const { token: tokenTwo } = signAuthToken(superAdminOne);
            const { user: superAdminTwo } = await createUser({
              email: 'superAdmin2@email.com',
              role: 'superAdmin',
              userName: 'superAdmin2',
            });
            await createBlackList({
              createdById: superAdminTwo.id,
              userId: userTwo.id,
            });
            const {
              status,
            } = await putUsersIdBlackListsId(app, tokenTwo, userTwo.id);
            expect(status).toBe(200);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.userId is not a UUIDv4', async () => {
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('user'));
            expect(status).toBe(400);
          });
          it('user.isBlackListed === false and do not have any blackList', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            expect(body.errors).toBe('user is not black listed');
            expect(status).toBe(400);
          });
          it('user.isBlackListed === false but have blackLists', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              active: false,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            expect(body.errors).toBe('user is not black listed');
            expect(status).toBe(400);
          });
          it('user.isBlackListed === true && user do not have blackList', async () => {
            const { user: userTwo } = await createUser({
              isBlackListed: true,
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            await userTwo.reload();
            expect(body.errors).toBe('user is not black listed');
            expect(status).toBe(400);
            expect(userTwo.isBlackListed).toBe(false);
          });
          it('the last created black list is expired', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            const { user: userTwo } = await createUser({
              isBlackListed: true,
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              time,
              userId: userTwo.id,
            });
            mockDate.set(timeStamp + time + 1);
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            await userTwo.reload();
            expect(body.errors).toBe('user is not black listed');
            expect(status).toBe(400);
            expect(userTwo.isBlackListed).toBe(false);
          });
          it('the last created blackList was created by a superAdmin and currentUser.role === \'admin\'', async () => {
            const { user: superAdmin } = await createUser({
              email: 'admin@email.com',
              role: 'superAdmin',
              userName: 'admin',
            });
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              createdById: superAdmin.id,
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, userTwo.id);
            await userTwo.reload();
            expect(body.errors).toBe('you\'re not allow to update this blackList');
            expect(status).toBe(400);
            expect(userTwo.isBlackListed).toBe(true);
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            const {
              body,
              status,
            } = await putUsersIdBlackListsId(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
