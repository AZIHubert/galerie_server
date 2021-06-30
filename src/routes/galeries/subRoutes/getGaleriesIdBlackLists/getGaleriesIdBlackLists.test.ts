import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import {
  createBlackList,
  createGalerie,
  createGalerieBlackList,
  createGalerieUser,
  createUser,
  getGaleriesIdBlackLists,
  testGalerieBlackList,
  testUser,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
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
          it('return no galerieBlackList', async () => {
            const {
              body: {
                action,
                data: {
                  galerieId: returnedGalerieId,
                  blackLists,
                },
              },
              status,
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            expect(action).toBe('GET');
            expect(blackLists.length).toBe(0);
            expect(returnedGalerieId).toBe(galerieId);
            expect(status).toBe(200);
          });
          it('return one galerieBlackList', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            expect(blackLists.length).toBe(1);
            testGalerieBlackList(blackLists[0]);
            expect(blackLists[0].createdBy.hasNewNotifications).toBeUndefined();
            expect(blackLists[0].user.hasNewNotifications).toBeUndefined();
            testUser(blackLists[0].createdBy);
            testUser(blackLists[0].user);
          });
          it('return a pack of 20 galerieBlackLists', async () => {
            const NUMBER = 21;
            const numOfGalerieBlackLists = new Array(NUMBER).fill(0);
            await Promise.all(
              numOfGalerieBlackLists.map(async (_, index) => {
                const { user: newUser } = await createUser({
                  email: `user${index + 2}@email.com`,
                  userName: `user${index + 2}`,
                });
                await createGalerieBlackList({
                  createdById: user.id,
                  galerieId,
                  userId: newUser.id,
                });
              }),
            );
            const {
              body: {
                data: {
                  blackLists: firstPack,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            const {
              body: {
                data: {
                  blackLists: secondPack,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId, {
              previousBlackList: firstPack[firstPack.length - 1].autoIncrementId,
            });
            expect(firstPack.length).toBe(20);
            expect(secondPack.length).toBe(1);
          });
          it('order galerieBlackList by createdAt', async () => {
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
            const { user: userSix } = await createUser({
              email: 'user6@email.com',
              userName: 'user6',
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userTwo.id,
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userThree.id,
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userFour.id,
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userFive.id,
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userSix.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            expect(blackLists.length).toBe(5);
            expect(blackLists[0].user.id).toBe(userSix.id);
            expect(blackLists[1].user.id).toBe(userFive.id);
            expect(blackLists[2].user.id).toBe(userFour.id);
            expect(blackLists[3].user.id).toBe(userThree.id);
            expect(blackLists[4].user.id).toBe(userTwo.id);
          });
          it('user.isBlackListed === true if he is \'globally\' black listed', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createBlackList({
              createdById: user.id,
              userId: userTwo.id,
            });
            await createGalerieBlackList({
              createdById: user.id,
              galerieId,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            expect(blackLists[0].user.isBlackListed).toBe(true);
          });
          it('do not include createdBy if galerieBlackList.createdById === null', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieBlackList({
              galerieId,
              userId: userTwo.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            expect(blackLists[0].createdBy).toBeNull();
          });
          it('createdBy.isBlackListed === true if he is \'globally\' black listed', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { user: userThree } = await createUser({
              email: 'user3@email.com',
              userName: 'user3',
            });
            await createGalerieUser({
              galerieId,
              userId: userThree.id,
            });
            await createGalerieBlackList({
              createdById: userThree.id,
              galerieId,
              userId: userTwo.id,
            });
            await createBlackList({
              createdById: user.id,
              userId: userThree.id,
            });
            const {
              body: {
                data: {
                  blackLists,
                },
              },
            } = await getGaleriesIdBlackLists(app, token, galerieId);
            expect(blackLists[0].createdBy.isBlackListed).toBe(true);
          });
          it('return blackLists if current user role for this galerie is \'moderator\'', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const { token: tokenTwo } = signAuthToken(userTwo);
            await createGalerieUser({
              galerieId,
              role: 'moderator',
              userId: userTwo.id,
            });
            const {
              status,
            } = await getGaleriesIdBlackLists(app, tokenTwo, galerieId);
            expect(status).toBe(200);
          });
          describe('should return first blackLists if req.query.previousBlackList', () => {
            let blackListId: string;

            beforeEach(async (done) => {
              try {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const { user: userThree } = await createUser({
                  email: 'user3@email.com',
                  userName: 'user3',
                });
                await createGalerieBlackList({
                  createdById: user.id,
                  galerieId,
                  userId: userTwo.id,
                });
                const blackList = await createGalerieBlackList({
                  createdById: user.id,
                  galerieId,
                  userId: userThree.id,
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
              } = await getGaleriesIdBlackLists(app, token, galerieId, {
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
              } = await getGaleriesIdBlackLists(app, token, galerieId, {
                previousBlackList: '-1',
              });
              expect(blackLists.length).toBe(2);
              expect(blackLists[0].id).toBe(blackListId);
            });
          });
        });
        describe('should return status 400 if', () => {
          it('request.params.galerieId is not a UUID v4', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdBlackLists(app, token, '100');
            expect(body.errors).toBe(INVALID_UUID('galerie'));
            expect(status).toBe(400);
          });
          it('current user\'s role for this galerie is \'user\'', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            await createGalerieUser({
              galerieId,
              userId: userTwo.id,
            });
            const { token: tokenTwo } = signAuthToken(userTwo);
            const {
              body,
              status,
            } = await getGaleriesIdBlackLists(app, tokenTwo, galerieId);
            expect(body.errors).toBe('you\'re not allow get the black lists from this galerie');
            expect(status).toBe(400);
          });
        });
        describe('should return status 404 if', () => {
          it('galerie doesn\'t exist', async () => {
            const {
              body,
              status,
            } = await getGaleriesIdBlackLists(app, token, uuidv4());
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
          it('galerie exist but current user is not subscribe to it', async () => {
            const { user: userTwo } = await createUser({
              email: 'user2@email.com',
              userName: 'user2',
            });
            const galerieTwo = await createGalerie({
              name: 'galerie2',
              userId: userTwo.id,
            });
            const {
              body,
              status,
            } = await getGaleriesIdBlackLists(app, token, galerieTwo.id);
            expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
            expect(status).toBe(404);
          });
        });
      });
    });
  });
});
