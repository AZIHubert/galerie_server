import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Like,
  User,
} from '@src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createBlackList,
  createGalerieUser,
  createLike,
  createUser,
  getGaleriesIdFramesIdLikes,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePictures,
  postUsersLogin,
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
              try {
                await cleanGoogleBuckets();
                await sequelize.sync({ force: true });
                const {
                  password,
                  user: createdUser,
                } = await createUser({
                  role: 'superAdmin',
                });

                user = createdUser;

                const { body } = await postUsersLogin(app, {
                  body: {
                    password,
                    userNameOrEmail: user.email,
                  },
                });
                token = body.token;
                const {
                  body: {
                    data: {
                      galerie: {
                        id,
                      },
                    },
                  },
                } = await postGaleries(app, token, {
                  body: {
                    name: 'galerie\'s name',
                  },
                });
                galerieId = id;
              } catch (err) {
                done(err);
              }
              done();
            });

            afterAll(async (done) => {
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
              let frameId: string;

              beforeEach(async (done) => {
                try {
                  const {
                    body: {
                      data: {
                        frame,
                      },
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  frameId = frame.id;
                } catch (err) {
                  done(err);
                }
                done();
              });

              it('should not include current user', async () => {
                await postGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                const {
                  body: {
                    action,
                    data: {
                      frameId: returnedFrameId,
                      galerieId: returnedGalerieId,
                      users,
                    },
                  },
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(action).toBe('GET');
                expect(returnedFrameId).toBe(frameId.toString());
                expect(returnedGalerieId).toBe(galerieId);
                expect(users.length).toBe(0);
                expect(status).toBe(200);
              });
              it('return no user', async () => {
                const {
                  body: {
                    data: {
                      users,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(users.length).toBe(0);
              });
              it.only('return One user', async () => {
                const {
                  password: passwordTwo,
                  user: userTwo,
                } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body: {
                    token: tokenTwo,
                  },
                } = await postUsersLogin(app, {
                  body: {
                    password: passwordTwo,
                    userNameOrEmail: userTwo.email,
                  },
                });
                const {
                  body: {
                    data: {
                      invitation: {
                        code,
                      },
                    },
                  },
                } = await postGaleriesIdInvitations(app, token, galerieId);
                await postGaleriesSubscribe(app, tokenTwo, {
                  body: {
                    code,
                  },
                });
                await postGaleriesIdFramesIdLikes(app, tokenTwo, galerieId, frameId);
                const {
                  body: {
                    data: {
                      users,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(users.length).toBe(1);
                expect(users[0].authTokenVersion).toBeUndefined();
                expect(users[0].confirmed).toBeUndefined();
                expect(users[0].confirmTokenVersion).toBeUndefined();
                expect(users[0].createdAt).not.toBeUndefined();
                expect(users[0].currentProfilePicture).not.toBeUndefined();
                expect(users[0].defaultProfilePicture).not.toBeUndefined();
                expect(users[0].email).toBeUndefined();
                expect(users[0].emailTokenVersion).toBeUndefined();
                expect(users[0].facebookId).toBeUndefined();
                expect(users[0].googleId).toBeUndefined();
                expect(users[0].hash).toBeUndefined();
                expect(users[0].id).not.toBeUndefined();
                expect(users[0].pseudonym).not.toBeUndefined();
                expect(users[0].resetPasswordTokenVersion).toBeUndefined();
                expect(users[0].role).not.toBeUndefined();
                expect(users[0].salt).toBeUndefined();
                expect(users[0].socialMediaUserName).not.toBeUndefined();
                expect(users[0].updatedAt).toBeUndefined();
                expect(users[0].updatedEmailTokenVersion).toBeUndefined();
                expect(users[0].userName).not.toBeUndefined();
              });
              it('return users with current profile picture', async () => {
                const {
                  password: passwordTwo,
                  user: userTwo,
                } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body: {
                    token: tokenTwo,
                  },
                } = await postUsersLogin(app, {
                  body: {
                    password: passwordTwo,
                    userNameOrEmail: userTwo.email,
                  },
                });
                const {
                  body: {
                    data: {
                      invitation: {
                        code,
                      },
                    },
                  },
                } = await postGaleriesIdInvitations(app, token, galerieId);
                await postGaleriesSubscribe(app, tokenTwo, {
                  body: {
                    code,
                  },
                });
                await postGaleriesIdFramesIdLikes(app, tokenTwo, galerieId, frameId);
                await postProfilePictures(app, tokenTwo);
                const {
                  body: {
                    data: {
                      users,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(users[0].currentProfilePicture.createdAt).not.toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImageId).toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.bucketName).toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.createdAt).toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.fileName).toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.format).not.toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.height).not.toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.id).toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.signedUrl).not.toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.size).not.toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
                expect(users[0].currentProfilePicture.cropedImage.width).not.toBeUndefined();
                expect(users[0].currentProfilePicture.current).toBeUndefined();
                expect(users[0].currentProfilePicture.id).not.toBeUndefined();
                expect(users[0].currentProfilePicture.originalImageId).toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.bucketName).toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.createdAt).toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.fileName).toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.format).not.toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.height).not.toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.id).toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.signedUrl).not.toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.size).not.toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.updatedAt).toBeUndefined();
                expect(users[0].currentProfilePicture.originalImage.width).not.toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImageId).toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.bucketName).toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.createdAt).toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.fileName).toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.format).not.toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.height).not.toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.id).toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.signedUrl).not.toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.size).not.toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
                expect(users[0].currentProfilePicture.pendingImage.width).not.toBeUndefined();
                expect(users[0].currentProfilePicture.updatedAt).toBeUndefined();
                expect(users[0].currentProfilePicture.userId).toBeUndefined();
              });
              it('return a pack of 20 users', async () => {
                const NUM = 21;
                const numOfLikes = new Array(NUM).fill(0);
                await Promise.all(
                  numOfLikes.map(async (_, index) => {
                    const { user: newUser } = await createUser({
                      email: `user${index + 2}@email.com`,
                      userName: `user${index + 2}`,
                    });
                    await Like.create({
                      frameId,
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
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                const {
                  body: {
                    data: {
                      users: secondPack,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId, { page: 2 });
                expect(firstPack.length).toBe(20);
                expect(secondPack.length).toBe(1);
              });
              it('TODO: order users by createdAt', async () => {});
              it.only('return null if user is black listed', async () => {
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
                const blackList = await createBlackList({
                  adminId: user.id,
                  userId: userTwo.id,
                });
                console.log(blackList);
                const {
                  body: {
                    data: {
                      users,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                console.log(users);
                expect(users.length).toBe(0);
              });
              it.only('whith blackList.active === false', async () => {
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
                const blackList = await createBlackList({
                  active: false,
                  adminId: user.id,
                  userId: userTwo.id,
                });
                console.log(blackList);
                const {
                  body: {
                    data: {
                      users,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                console.log(users);
                expect(users.length).toBe(1);
              });
              it('TODO: return user if black list has expired', async () => {});
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
                  password: passwordTwo,
                  user: userTwo,
                } = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body: {
                    token: tokenTwo,
                  },
                } = await postUsersLogin(app, {
                  body: {
                    password: passwordTwo,
                    userNameOrEmail: userTwo.email,
                  },
                });
                const {
                  body: {
                    data: {
                      galerie,
                    },
                  },
                } = await postGaleries(app, tokenTwo, {
                  body: {
                    name: 'galerie\'s name',
                  },
                });
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerie.id, uuidv4());
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
                const {
                  body: {
                    data: {
                      galerie,
                    },
                  },
                } = await postGaleries(app, token, {
                  body: {
                    name: 'galerie\'s name',
                  },
                });
                const {
                  body: {
                    data: {
                      frame,
                    },
                  },
                } = await postGaleriesIdFrames(app, token, galerie.id);
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
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
