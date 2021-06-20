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
  putBlackListsId,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/blackLists', () => {
  describe('/:blackListId', () => {
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

        it('return blackListId', async () => {
          const { id: blackListId } = await createBlackList({
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            body: {
              action,
              data: {
                blackListId: returnedBlackList,
              },
            },
            status,
          } = await putBlackListsId(app, token, blackListId);
          expect(action).toBe('PUT');
          expect(returnedBlackList).toBe(blackListId);
          expect(status).toBe(200);
        });
        it('set user.blackListedAt === null && user.isBlackListed === false', async () => {
          const blackList = await createBlackList({
            createdById: user.id,
            userId: userTwo.id,
          });
          await putBlackListsId(app, token, blackList.id);
          await userTwo.reload();
          expect(userTwo.blackListedAt).toBeNull();
          expect(userTwo.isBlackListed).toBe(false);
        });
        it('set blackList.updatedById === currentUser.id', async () => {
          const blackList = await createBlackList({
            createdById: user.id,
            userId: userTwo.id,
          });
          await putBlackListsId(app, token, blackList.id);
          await blackList.reload();
          expect(blackList.updatedById).toBe(user.id);
        });
        it('don\'t return error if currentUser.role === \'superAdmin\'', async () => {
          const {
            user: userThree,
          } = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const { id: blackListId } = await createBlackList({
            createdById: userThree.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await putBlackListsId(app, token, blackListId);
          expect(status).toBe(200);
        });
        it('don\'t return error if currentUser.role === \'admin\' and blackList.createdBy.role === \'admin\'', async () => {
          const {
            user: userThree,
          } = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const {
            user: userFour,
          } = await createUser({
            email: 'user4@email.com',
            role: 'admin',
            userName: 'user4',
          });
          const { token: tokenFour } = signAuthToken(userFour);
          const { id: blackListId } = await createBlackList({
            createdById: userThree.id,
            userId: userTwo.id,
          });
          const {
            status,
          } = await putBlackListsId(app, tokenFour, blackListId);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.blackListId is not valid', async () => {
          const {
            body,
            status,
          } = await putBlackListsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('black list'));
          expect(status).toBe(400);
        });
        it('blackList.active === false', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const { id: blackListId } = await createBlackList({
            active: false,
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await putBlackListsId(app, token, blackListId);
          expect(body.errors).toBe('not allow to update a non active black list');
          expect(status).toBe(400);
        });
        it('currentUser.role === \'admin\' and blackList.createdBy.role === \'superAdmin\'', async () => {
          const {
            user: userTwo,
          } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const {
            user: userThree,
          } = await createUser({
            email: 'user3@email.com',
            role: 'admin',
            userName: 'user3',
          });
          const { token: tokenThree } = signAuthToken(userThree);
          const { id: blackListId } = await createBlackList({
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            body,
            status,
          } = await putBlackListsId(app, tokenThree, blackListId);
          expect(body.errors).toBe('you\'re not allow to update this blackList');
          expect(status).toBe(400);
        });
        it('blackList is expired', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const { user: userTwo } = await createUser({
            email: 'user2@email.com',
            userName: 'user2',
          });
          const blackList = await createBlackList({
            createdById: user.id,
            time,
            userId: userTwo.id,
          });
          mockDate.set(timeStamp + time + 1);
          const {
            body,
            status,
          } = await putBlackListsId(app, token, blackList.id);
          await blackList.reload();
          await userTwo.reload();
          expect(blackList.updatedById).toBeNull();
          expect(userTwo.blackListedAt).toBeNull();
          expect(userTwo.isBlackListed).toBe(false);
          expect(body.errors).toBe('not allow to update a non active black list');
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('blackList not found', async () => {
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
