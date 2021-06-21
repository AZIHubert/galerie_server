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
  getBlackListsId,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/blackLists', () => {
  describe('/:blackListId', () => {
    describe('GET', () => {
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

        it('return black list', async () => {
          const { id: blackListId } = await createBlackList({
            createdById: user.id,
            userId: userTwo.id,
          });
          const {
            body: {
              action,
              data: {
                blackList,
              },
            },
            status,
          } = await getBlackListsId(app, token, blackListId);
          expect(action).toBe('GET');
          expect(blackList.active).not.toBeUndefined();
          expect(blackList.createdById).toBeUndefined();
          expect(blackList.createdAt).not.toBeUndefined();
          expect(blackList.id).not.toBeUndefined();
          expect(blackList.reason).not.toBeUndefined();
          expect(blackList.updatedAt).not.toBeUndefined();
          expect(blackList.updatedBy).not.toBeUndefined();
          expect(blackList.updatedById).toBeUndefined();
          expect(blackList.userId).toBeUndefined();
          expect(status).toBe(200);
          testUser(blackList.user);
          testUser(blackList.createdBy);
        });
        it('include blackList.updatedBy', async () => {
          const { id: blackListId } = await createBlackList({
            active: false,
            createdById: user.id,
            updatedById: user.id,
            userId: userTwo.id,
          });
          const {
            body: {
              data: {
                blackList: {
                  updatedBy,
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
          expect(updatedBy.authTokenVersion).toBeUndefined();
          expect(updatedBy.blackListedAt).toBeUndefined();
          expect(updatedBy.confirmed).toBeUndefined();
          expect(updatedBy.confirmTokenVersion).toBeUndefined();
          expect(updatedBy.createdAt).not.toBeUndefined();
          expect(updatedBy.currentProfilePicture).not.toBeUndefined();
          expect(updatedBy.email).toBeUndefined();
          expect(updatedBy.emailTokenVersion).toBeUndefined();
          expect(updatedBy.facebookId).toBeUndefined();
          expect(updatedBy.googleId).toBeUndefined();
          expect(updatedBy.hash).toBeUndefined();
          expect(updatedBy.id).not.toBeUndefined();
          expect(updatedBy.isBlackListed).toBeUndefined();
          expect(updatedBy.pseudonym).not.toBeUndefined();
          expect(updatedBy.resetPasswordTokenVersion).toBeUndefined();
          expect(updatedBy.role).not.toBeUndefined();
          expect(updatedBy.salt).toBeUndefined();
          expect(updatedBy.socialMediaUserName).not.toBeUndefined();
          expect(updatedBy.updatedAt).toBeUndefined();
          expect(updatedBy.updatedEmailTokenVersion).toBeUndefined();
          expect(updatedBy.userName).not.toBeUndefined();
        });
        it('do not include createdBy if he have delete his account', async () => {
          const { id: blackListId } = await createBlackList({
            userId: userTwo.id,
          });
          const {
            body: {
              data: {
                blackList: {
                  createdBy,
                },
              },
            },
          } = await getBlackListsId(app, token, blackListId);
          expect(createdBy).toBeNull();
        });
        it('set user.isBlackListed === false and user.blackListedAt === null if it\'s expired', async () => {
          const timeStamp = 1434319925275;
          const time = 1000 * 60 * 10;
          mockDate.set(timeStamp);
          const blackList = await createBlackList({
            createdById: user.id,
            time,
            userId: userTwo.id,
          });
          mockDate.set(timeStamp + time + 1);
          const {
            status,
          } = await getBlackListsId(app, token, blackList.id);
          await userTwo.reload();
          expect(userTwo.blackListedAt).toBeNull();
          expect(userTwo.isBlackListed).toBe(false);
          expect(status).toBe(200);
        });
      });
      describe('should return status 400 if', () => {
        it('req.params.blackListId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await getBlackListsId(app, token, '100');
          expect(body.errors).toBe(INVALID_UUID('black list'));
          expect(status).toBe(400);
        });
      });
      describe('should return status 404 if', () => {
        it('black list doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getBlackListsId(app, token, uuidv4());
          expect(body.errors).toBe(MODEL_NOT_FOUND('black list'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
