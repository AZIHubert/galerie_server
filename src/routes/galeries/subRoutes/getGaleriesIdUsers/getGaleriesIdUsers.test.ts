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
  createBlackList,
  createGalerie,
  createGalerieUser,
  createUser,
  getGaleriesIdUsers,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('@src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/users', () => {
      describe('GET', () => {
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
            } = await createUser({});
            user = createdUser;
            const jwt = signAuthToken(user);
            token = jwt.token;
            const galerie = await createGalerie({
              userId: user.id,
            });
            galerieId = galerie.id;
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

        describe('should return status 200 and', () => {
          it('do not return current user', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  users,
                },
              },
              status,
            } = await getGaleriesIdUsers(app, token, galerieId);
            expect(action).toBe('GET');
            expect(returnedGalerieId).toBe(galerieId);
            expect(users.length).toBe(0);
            expect(status).toBe(200);
          });
          it('return 1 user', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId);
            expect(users.length).toBe(1);
            expect(users[0].galerieRole).not.toBeUndefined();
            expect(users[0].hasNewNotifications).toBeUndefined();
            testUser(users[0]);
          });
          it('do not return users if their not subscribe to this galerie', async () => {
            await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId);
            expect(users.length).toBe(0);
          });
          it('return a pack of 20 users', async () => {
            const NUM = 21;
            const numOfUsers = new Array(NUM).fill(0);
            await Promise.all(
              numOfUsers.map(async (_, index) => {
                const { user: newUser } = await createUser({
                  email: `user${index + 2}@email.com`,
                  userName: `user${index + 2}`,
                });
                await createGalerieUser({
                  galerieId,
                  userId: newUser.id,
                });
              }),
            );
            const {
              body: {
                data: {
                  users: firstPack,
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId);
            const {
              body: {
                data: {
                  users: secondPack,
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId, { page: 2 });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('sort users by pseudonym', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'd',
            });
            const {
              user: userThree,
            } = await createUser({
              email: 'user3@email.com',
              userName: 'c',
            });
            const {
              user: userFour,
            } = await createUser({
              email: 'user4@email.com',
              userName: 'b',
            });
            const {
              user: userFive,
            } = await createUser({
              email: 'user5@email.com',
              userName: 'a',
            });
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            await createGalerieUser({
              galerieId,
              userId: userThree.id,
            });
            await createGalerieUser({
              galerieId,
              userId: userFour.id,
            });
            await createGalerieUser({
              galerieId,
              userId: userFive.id,
            });
            const {
              body: {
                data: {
                  users,
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId);
            expect(users[0].id).toBe(userFive.id);
            expect(users[1].id).toBe(userFour.id);
            expect(users[2].id).toBe(userThree.id);
            expect(users[3].id).toBe(userTwo.id);
          });
          it('return user.isBlackListed if he\'s black listed', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            await createBlackList({
              createdById: user.id,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  users: [{
                    isBlackListed,
                  }],
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId);
            expect(isBlackListed).toBe(true);
          });
          it('return user.isBlackListed === false if his blackList is expired', async () => {
            const timeStamp = 1434319925275;
            const time = 1000 * 60 * 10;
            mockDate.set(timeStamp);
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieUser({
              galerieId,
              role: 'admin',
              userId: userTwo.id,
            });
            await createBlackList({
              createdById: user.id,
              time,
              userId: userTwo.id,
            });
            mockDate.set(timeStamp + time + 1);
            const {
              body: {
                data: {
                  users: [{
                    isBlackListed,
                  }],
                },
              },
            } = await getGaleriesIdUsers(app, token, galerieId);
            await userTwo.reload();
            expect(isBlackListed).toBe(false);
            expect(userTwo.isBlackListed).toBe(false);
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdUsers(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('galerie doesn\'t exist', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdUsers(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('galerie exist but user is not subscribe to it', async () => {
            const {
              user: userTwo,
            } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const galerieTwo = await createGalerie({
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await getGaleriesIdUsers(app, token, galerieTwo.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
