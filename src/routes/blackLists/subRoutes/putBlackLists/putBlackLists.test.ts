import { Server } from 'http';
import mockDate from 'mockdate';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createBlackList,
  createUser,
  putBlackLists,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/blackLists', () => {
  describe('/expired', () => {
    describe('PUT', () => {
      beforeAll(() => {
        sequelize = initSequelize();
        app = initApp();
      });

      beforeEach(async (done) => {
        mockDate.reset();
        try {
          await sequelize.sync({ force: true });
          const {
            user: createdUser,
          } = await createUser({
            role: 'superAdmin',
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
          await sequelize.sync({ force: true });
          await sequelize.close();
        } catch (err) {
          done(err);
        }
        app.close();
        done();
      });

      describe('should return a status 204 and', () => {
        it('set active to false one expired blackList', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const blackList = await createBlackList({
            adminId: user.id,
            time,
            userId: userTwo.id,
          });
          mockDate.set(timeStamp + time + 1);
          const { status } = await putBlackLists(app, token);
          await blackList.reload();
          expect(blackList.active).toBe(false);
          expect(status).toBe(204);
        });
        it('set active to false two expired blackLists', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const blackListOne = await createBlackList({
            adminId: user.id,
            time,
            userId: userTwo.id,
          });
          const blackListTwo = await createBlackList({
            adminId: user.id,
            time,
            userId: userThree.id,
          });
          mockDate.set(timeStamp + time + 1);
          await putBlackLists(app, token);
          await blackListOne.reload();
          await blackListTwo.reload();
          expect(blackListOne.active).toBe(false);
          expect(blackListTwo.active).toBe(false);
        });
        it('set active to false Four expired blackLists', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { user: userThree } = await createUser({
            email: 'user3@email.com',
            userName: 'user3',
          });
          const { user: userFour } = await createUser({
            email: 'user4@email.com',
            userName: 'user4',
          });
          const { user: userFive } = await createUser({
            email: 'user5@email.com',
            userName: 'user5',
          });
          const blackListOne = await createBlackList({
            adminId: user.id,
            time,
            userId: userTwo.id,
          });
          const blackListTwo = await createBlackList({
            adminId: user.id,
            time,
            userId: userThree.id,
          });
          const blackListThree = await createBlackList({
            adminId: user.id,
            time,
            userId: userFour.id,
          });
          const blackListFour = await createBlackList({
            adminId: user.id,
            time,
            userId: userFive.id,
          });
          mockDate.set(timeStamp + time + 1);
          await putBlackLists(app, token);
          await blackListOne.reload();
          await blackListTwo.reload();
          await blackListThree.reload();
          await blackListFour.reload();
          expect(blackListOne.active).toBe(false);
          expect(blackListTwo.active).toBe(false);
          expect(blackListThree.active).toBe(false);
          expect(blackListFour.active).toBe(false);
        });
        it('do not set active to false if a blackList.time === null', async () => {
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const blackList = await createBlackList({
            adminId: user.id,
            userId: userTwo.id,
          });
          await putBlackLists(app, token);
          await blackList.reload();
          expect(blackList.active).toBe(true);
        });
        it('do not set active to false if a blackList is not expired', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const blackList = await createBlackList({
            adminId: user.id,
            time,
            userId: userTwo.id,
          });
          mockDate.set(timeStamp + time - 1);
          await putBlackLists(app, token);
          expect(blackList.active).toBe(true);
        });
      });
    });
  });
});
