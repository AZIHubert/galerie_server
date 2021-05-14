import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesIdFramesIdLikes,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postProfilePicture,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/galeries', () => {
  let app: Server;
  let galerieId: string;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });
      user = await createUser({
        role: 'superAdmin',
      });
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGalerie(app, token, {
        name: 'galerie\'s name',
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
  describe('/:id', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('/likes', () => {
          describe('GET', () => {
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
              it('return One user', async () => {
                const userTwo = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body: {
                    token: tokenTwo,
                  },
                } = await login(app, userTwo.email, userPassword);
                const {
                  body: {
                    data: {
                      invitation: {
                        code,
                      },
                    },
                  },
                } = await postGaleriesIdInvitations(app, token, galerieId, {});
                await postGaleriesSubscribe(app, tokenTwo, { code });
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
                expect(users[0].createdAt).toBeUndefined();
                expect(users[0].currentProfilePicture).not.toBeUndefined();
                expect(users[0].defaultProfilePicture).not.toBeUndefined();
                expect(users[0].email).toBeUndefined();
                expect(users[0].emailTokenVersion).toBeUndefined();
                expect(users[0].facebookId).toBeUndefined();
                expect(users[0].googleId).toBeUndefined();
                expect(users[0].id).not.toBeUndefined();
                expect(users[0].password).toBeUndefined();
                expect(users[0].pseudonym).not.toBeUndefined();
                expect(users[0].resetPasswordTokenVersion).toBeUndefined();
                expect(users[0].role).not.toBeUndefined();
                expect(users[0].socialMediaUserName).not.toBeUndefined();
                expect(users[0].updatedAt).toBeUndefined();
                expect(users[0].updatedEmailTokenVersion).toBeUndefined();
                expect(users[0].userName).not.toBeUndefined();
              });
              it('return users with current profile picture', async () => {
                const userTwo = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body: {
                    token: tokenTwo,
                  },
                } = await login(app, userTwo.email, userPassword);
                const {
                  body: {
                    data: {
                      invitation: {
                        code,
                      },
                    },
                  },
                } = await postGaleriesIdInvitations(app, token, galerieId, {});
                await postGaleriesSubscribe(app, tokenTwo, { code });
                await postGaleriesIdFramesIdLikes(app, tokenTwo, galerieId, frameId);
                await postProfilePicture(app, tokenTwo);
                const {
                  body: {
                    data: {
                      users,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(users[0].currentProfilePicture.createdAt).toBeUndefined();
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
                const numOfLikes = new Array(3).fill(0);
                const {
                  body: {
                    data: {
                      invitation: {
                        code,
                      },
                    },
                  },
                } = await postGaleriesIdInvitations(app, token, galerieId, {});
                await Promise.all(
                  numOfLikes.map(async (_, index) => {
                    const newUser = await createUser({
                      email: `user${index + 2}@email.com`,
                      userName: `user${index + 2}`,
                    });
                    const {
                      body: {
                        token: tokenTwo,
                      },
                    } = await login(app, newUser.email, userPassword);
                    await postGaleriesSubscribe(app, tokenTwo, { code });
                    await postGaleriesIdFramesIdLikes(app, tokenTwo, galerieId, frameId);
                  }),
                );
                const {
                  body: {
                    data: {
                      users: firstPack,
                    },
                  },
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
                expect(firstPack.length).toBe(3);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie doesn\'t exist', async () => {
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, '100', '100');
                expect(body.errors).toBe('galerie not found');
                expect(status).toBe(404);
              });
              it('galerie exist but current user is not subscribe to it', async () => {
                const userTwo = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const {
                  body: {
                    token: tokenTwo,
                  },
                } = await login(app, userTwo.email, userPassword);
                const {
                  body: {
                    data: {
                      galerie,
                    },
                  },
                } = await postGalerie(app, tokenTwo, {
                  name: 'galerie\'s name',
                });
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerie.id, '100');
                expect(body.errors).toBe('galerie not found');
                expect(status).toBe(404);
              });
              it('frame doesn\'t exist', async () => {
                const {
                  body,
                  status,
                } = await getGaleriesIdFramesIdLikes(app, token, galerieId, '100');
                expect(body.errors).toBe('frame not found');
                expect(status).toBe(404);
              });
              it('frame exist but is not post on this galerie', async () => {
                const {
                  body: {
                    data: {
                      galerie,
                    },
                  },
                } = await postGalerie(app, token, {
                  name: 'galerie\'s name',
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
                expect(body.errors).toBe('frame not found');
                expect(status).toBe(404);
              });
            });
          });
        });
      });
    });
  });
});
