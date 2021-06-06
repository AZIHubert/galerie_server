import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
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
  createUser,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
  postUsersLogin,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/galerie', () => {
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

  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('/likes', () => {
          describe('POST', () => {
            describe('it should return status 200 and', () => {
              let frame: Frame;
              beforeEach(async (done) => {
                try {
                  const {
                    body: {
                      data,
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  frame = data.frame;
                } catch (err) {
                  done(err);
                }
                done();
              });
              it('post Like if this frame wasn\'s like by current user', async () => {
                const {
                  body: {
                    action,
                    data: {
                      frameId: returnedFrameId,
                      galerieId: returnedGalerieId,
                      numOfLikes,
                    },
                  },
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const like = await Like.findOne({
                  where: {
                    frameId: frame.id,
                    userId: user.id,
                  },
                });
                expect(action).toBe('POST');
                expect(like).not.toBeNull();
                expect(numOfLikes).toBe(frame.numOfLikes + 1);
                expect(returnedFrameId).toBe(frame.id.toString());
                expect(returnedGalerieId).toBe(galerieId);
                expect(status).toBe(200);
              });
              it('increment frame.numOfLikes if this frame wasn\'t like by current user', async () => {
                const {
                  body: {
                    data: {
                      numOfLikes,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const updatedFrame = await Frame.findByPk(frame.id) as Frame;
                expect(updatedFrame.numOfLikes).toBe(numOfLikes);
              });
              it('destroy Like if this frame was like by current user', async () => {
                const {
                  body: {
                    data: {
                      numOfLikes: numOfLikesAfterLike,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const {
                  body: {
                    data: {
                      numOfLikes: numOfLikesAfterUnlike,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const like = await Like.findOne({
                  where: {
                    frameId: frame.id,
                    userId: user.id,
                  },
                });
                expect(like).toBeNull();
                expect(numOfLikesAfterUnlike).toBe(numOfLikesAfterLike - 1);
              });
              it('decrement frame.numOfLikes if this frame was like by current user', async () => {
                await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const {
                  body: {
                    data: {
                      numOfLikes,
                    },
                  },
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
                const updatedFrame = await Frame.findByPk(frame.id) as Frame;
                expect(updatedFrame.numOfLikes).toBe(numOfLikes);
              });
            });
            describe('should return status 400 if', () => {
              it('request.parmas.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, '100', uuidv4());
                expect(body.errors).toBe(INVALID_UUID('galerie'));
                expect(status).toBe(400);
              });
              it('request.parmas.galerieId is not a UUID v4', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, uuidv4(), '100');
                expect(body.errors).toBe(INVALID_UUID('frame'));
                expect(status).toBe(400);
              });
            });
            describe('should return status 404 if', () => {
              it('galerie not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, uuidv4(), uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('galerie exist by current user is not subscribe to it', async () => {
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
                } = await postGaleriesIdFramesIdLikes(app, token, galerie.id, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                expect(status).toBe(404);
              });
              it('frame not found', async () => {
                const {
                  body,
                  status,
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, uuidv4());
                expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                expect(status).toBe(404);
              });
              it('frame exist but it not post on this galerie', async () => {
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
                } = await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
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
