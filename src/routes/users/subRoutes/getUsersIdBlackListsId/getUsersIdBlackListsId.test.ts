import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  User,
} from '@src/db/models';

import {
  MODEL_NOT_FOUND,
  INVALID_UUID,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import { signAuthToken } from '@src/helpers/issueJWT';
import {
  createBlackList,
  createUser,
  getUsersIdBlackListsId,
  testBlackList,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/user', () => {
  describe('/:userId', () => {
    describe('/blackLists', () => {
      describe('/:blackListId', () => {
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

            it('return blackList', async () => {
              const blackList = await createBlackList({
                userId: userTwo.id,
              });
              const {
                body: {
                  action,
                  data: {
                    userId,
                    blackList: returnedBlackList,
                  },
                },
                status,
              } = await getUsersIdBlackListsId(app, token, userTwo.id, blackList.id);
              expect(action).toBe('GET');
              expect(userId).toBe(userTwo.id);
              expect(status).toBe(200);
              testBlackList(returnedBlackList, blackList);
            });
            it('include createdBy', async () => {
              const { id: blackListId } = await createBlackList({
                createdById: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getUsersIdBlackListsId(app, token, userTwo.id, blackListId);
              testUser(blackList.createdBy, user);
            });
            it('include updatedBy', async () => {
              const { id: blackListId } = await createBlackList({
                updatedById: user.id,
                userId: userTwo.id,
              });
              const {
                body: {
                  data: {
                    blackList,
                  },
                },
              } = await getUsersIdBlackListsId(app, token, userTwo.id, blackListId);
              testUser(blackList.updatedBy, user);
            });
          });
          describe('should return status 400 if', () => {
            it('request.params.userId is not a UUIDv4', async () => {
              const {
                body,
                status,
              } = await getUsersIdBlackListsId(app, token, '100', '100');
              expect(body.errors).toBe(INVALID_UUID('user'));
              expect(status).toBe(400);
            });
            it('request.params.blackList is not a UUIDv4', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await getUsersIdBlackListsId(app, token, userTwo.id, '100');
              expect(body.errors).toBe(INVALID_UUID('black list'));
              expect(status).toBe(400);
            });
          });
          describe('should return status 404 if', () => {
            it('user not found', async () => {
              const {
                body,
                status,
              } = await getUsersIdBlackListsId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('user'));
              expect(status).toBe(404);
            });
            it('black list not found', async () => {
              const { user: userTwo } = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await getUsersIdBlackListsId(app, token, userTwo.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
