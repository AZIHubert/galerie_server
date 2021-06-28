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
  createFrame,
  createGalerie,
  createGalerieUser,
  createLike,
  createUser,
  getGaleriesIdFramesIdLikes,
  testUser,
} from '@src/helpers/test';

import initApp from '@src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('/likes', () => {
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
                } = await createUser({
                  role: 'superAdmin',
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
              let frameId: string;

              beforeEach(async (done) => {
                try {
                  const frame = await createFrame({
                    galerieId,
                    userId: user.id,
                  });
                  frameId = frame.id;
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('should not include current user', async () => {
                await createLike({
                  frameId,
                  userId: user.id,
                });
                const {
                  body: {
                    action,
                    data: {
                      frameId: returnedFrameId,
                      galerieId: returnedGalerieId,
                      likes,
                    },
                  },
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(action).toBe('GET');
                expect(returnedFrameId).toBe(frameId.toString());
                expect(returnedGalerieId).toBe(galerieId);
                expect(likes.length).toBe(0);
                expect(status).toBe(200);
              });
              it('return no like', async () => {
                const {
                  body: {
                    data: {
                      likes,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(likes.length).toBe(0);
              });
              it('return One like', async () => {
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
                await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                const {
                  body: {
                    data: {
                      likes,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(likes.length).toBe(1);
                expect(likes[0].autoIncrementId).not.toBeUndefined();
                expect(likes[0].user.hasNewNotifications).toBeUndefined();
                testUser(likes[0].user);
              });
              it('return a pack of 20 likes', async () => {
                const NUM = 21;
                const numOfLikes = new Array(NUM).fill(0);
                await Promise.all(
                  numOfLikes.map(async (_, index) => {
                    const { user: newUser } = await createUser({
                      email: `user${index + 2}@email.com`,
                      userName: `user${index + 2}`,
                    });
                    await createLike({
                      frameId,
                      userId: newUser.id,
                    });
                  }),
                );
                const {
                  body: {
                    data: {
                      likes: firstPack,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                const {
                  body: {
                    data: {
                      likes: secondPack,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId, {
                  previousLike: firstPack[firstPack.length - 1].autoIncrementId,
                });
                expect(firstPack.length).toBe(20);
                expect(secondPack.length).toBe(1);
              });
              it('order likes by createdAt', async () => {
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
                await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: userThree.id,
                });
                await createLike({
                  frameId,
                  userId: userFour.id,
                });
                await createLike({
                  frameId,
                  userId: userFive.id,
                });
                await createLike({
                  frameId,
                  userId: userSix.id,
                });
                const {
                  body: {
                    data: {
                      likes,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(likes.length).toBe(5);
                expect(likes[0].user.id).toBe(userSix.id);
                expect(likes[1].user.id).toBe(userFive.id);
                expect(likes[2].user.id).toBe(userFour.id);
                expect(likes[3].user.id).toBe(userThree.id);
                expect(likes[4].user.id).toBe(userTwo.id);
              });
              it('return like.user.isBlackListed === true if is black listed', async () => {
                const { user: userTwo } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                await createGalerieUser({
                  galerieId,
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
                  userId: userTwo.id,
                });
                await createBlackList({
                  createdById: user.id,
                  userId: userTwo.id,
                });
                const {
                  body: {
                    data: {
                      likes,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(likes.length).toBe(1);
                expect(likes[0].user.isBlackListed).toBe(true);
              });
              it('return like.user.isBlackListed === false if black list has expired', async () => {
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
                  userId: userTwo.id,
                });
                await createLike({
                  frameId,
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
                      likes,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                await userTwo.reload();
                expect(likes[0].user.isBlackListed).toBe(false);
                expect(userTwo.isBlackListed).toBe(false);
              });
            });
            describe('should return status 400 if', () => {
              it('request.params.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, '100', uuidv4());
                expect(body.errors).toBe(INVALID_UUID('galerie'));
                expect(status).toBe(400);
              });
              it('request.params.frameId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, uuidv4(), '100');
                expect(body.errors).toBe(INVALID_UUID('frame'));
                expect(status).toBe(400);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie doesn\'t exist', async () => {
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, uuidv4(), uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('galerie exist but current user is not subscribe to it', async () => {
                const {
                  user: userTwo,
                } = await createUser({
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
                } = await getGaleriesIdFramesIdLikes(app, token, galerieTwo.id, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('frame doesn\'t exist', async () => {
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
              it('frame exist but is not post on this galerie', async () => {
                const galerieTwo = await createGalerie({
                  name: 'galerie2',
                  userId: user.id,
                });
                const { id: frameId } = await createFrame({
                  galerieId: galerieTwo.id,
                  userId: user.id,
                });
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});
