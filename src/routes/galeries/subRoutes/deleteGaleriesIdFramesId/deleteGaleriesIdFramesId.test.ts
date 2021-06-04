import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  GaleriePicture,
  Image,
  Like,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGaleriesIdFramesId,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postUsersLogin,
  putGaleriesIdUsersId,
} from '@src/helpers/test';

import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');
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
      user = await createUser({});
      const { body } = await postUsersLogin(app, {
        body: {
          password: userPassword,
          userNameOrEmail: user.email,
        },
      });
      token = body.token;
      const {
        body: {
          data: {
            galerie,
          },
        },
      } = await postGaleries(app, token, {
        name: 'galerie\'s name',
      });
      galerieId = galerie.id;
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
        describe('DELETE', () => {
          describe('it should return status 200 and', () => {
            it('delete frame', async () => {
              const {
                body: {
                  data: {
                    frame: {
                      id: frameId,
                    },
                  },
                },
              } = await postGaleriesIdFrames(app, token, galerieId);
              const {
                body: {
                  action,
                  data,
                },
                status,
              } = await deleteGaleriesIdFramesId(app, token, galerieId, frameId);
              const [bucketCropedImages] = await gc
                .bucket(GALERIES_BUCKET_PP_CROP)
                .getFiles();
              const [bucketOriginalImages] = await gc
                .bucket(GALERIES_BUCKET_PP)
                .getFiles();
              const [bucketPendingImages] = await gc
                .bucket(GALERIES_BUCKET_PP_PENDING)
                .getFiles();
              const frame = await Frame.findByPk(frameId);
              const galeriePictures = await GaleriePicture.findAll({
                where: {
                  frameId,
                },
              });
              const images = await Image.findAll();
              expect(action).toBe('DELETE');
              expect(bucketCropedImages.length).toBe(0);
              expect(bucketOriginalImages.length).toBe(0);
              expect(bucketPendingImages.length).toBe(0);
              expect(data.frameId).toBe(String(frameId));
              expect(data.galerieId).toBe(String(galerieId));
              expect(frame).toBeNull();
              expect(galeriePictures.length).toBe(0);
              expect(images.length).toBe(0);
              expect(status).toBe(200);
            });
            it('should destroy all likes', async () => {
              const {
                body: {
                  data: {
                    frame: {
                      id: frameId,
                    },
                  },
                },
              } = await postGaleriesIdFrames(app, token, galerieId);
              await postGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
              await deleteGaleriesIdFramesId(app, token, galerieId, frameId);
              const like = await Like.findOne({
                where: {
                  frameId,
                },
              });
              expect(like).toBeNull();
            });
            it('should destroy frame if it\'s not posted by current user but it\'s role is \'creator\'', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await postUsersLogin(app, {
                body: {
                  password: userPassword,
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
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              await postGaleriesSubscribe(app, tokenTwo, { code });
              const {
                body: {
                  data: {
                    frame: {
                      id: frameId,
                    },
                  },
                },
              } = await postGaleriesIdFrames(app, tokenTwo, galerieId);
              await deleteGaleriesIdFramesId(app, token, galerieId, frameId);
              const frame = await Frame.findByPk(galerieId);
              expect(frame).toBeNull();
            });
            it('should destroy frame if it\'s not posted by current user but it\'s role is \'admin\'', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const userThree = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await postUsersLogin(app, {
                body: {
                  password: userPassword,
                  userNameOrEmail: userTwo.email,
                },
              });
              const {
                body: {
                  token: tokenThree,
                },
              } = await postUsersLogin(app, {
                body: {
                  password: userPassword,
                  userNameOrEmail: userThree.email,
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
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              await postGaleriesSubscribe(app, tokenTwo, { code });
              await postGaleriesSubscribe(app, tokenThree, { code });
              const {
                body: {
                  data: {
                    frame: {
                      id: frameId,
                    },
                  },
                },
              } = await postGaleriesIdFrames(app, tokenTwo, galerieId);
              await putGaleriesIdUsersId(app, token, galerieId, userThree.id);
              await deleteGaleriesIdFramesId(app, tokenThree, galerieId, frameId);
              const frame = await Frame.findByPk(galerieId);
              expect(frame).toBeNull();
            });
          });
          describe('it should return status 400', () => {
            it('req.params.galerieId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdFramesId(app, token, '100', uuidv4());
              expect(body.errors).toBe(INVALID_UUID('galerie'));
              expect(status).toBe(400);
            });
            it('req.params.frameId is not a UUID v4', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdFramesId(app, token, uuidv4(), '100');
              expect(body.errors).toBe(INVALID_UUID('frame'));
              expect(status).toBe(400);
            });
            it('user\'s role is \'user\'', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const userThree = await createUser({
                email: 'user3@email.com',
                userName: 'user3',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await postUsersLogin(app, {
                body: {
                  password: userPassword,
                  userNameOrEmail: userTwo.email,
                },
              });
              const {
                body: {
                  token: tokenThree,
                },
              } = await postUsersLogin(app, {
                body: {
                  password: userPassword,
                  userNameOrEmail: userThree.email,
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
              } = await postGaleriesIdInvitations(app, token, galerieId, {});
              await postGaleriesSubscribe(app, tokenTwo, { code });
              await postGaleriesSubscribe(app, tokenThree, { code });
              const {
                body: {
                  data: {
                    frame: {
                      id: frameId,
                    },
                  },
                },
              } = await postGaleriesIdFrames(app, tokenTwo, galerieId);
              const {
                body,
                status,
              } = await deleteGaleriesIdFramesId(app, tokenThree, galerieId, frameId);
              expect(body.errors).toBe('your not allow to delete this frame');
              expect(status).toBe(400);
            });
          });
          describe('it should return status 404', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdFramesId(app, token, uuidv4(), uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('frame not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdFramesId(app, token, galerieId, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
            it('galerie exist but user is not subscribe to it', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body: {
                  token: tokenTwo,
                },
              } = await postUsersLogin(app, {
                body: {
                  password: userPassword,
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
                name: 'galerie\'s name',
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdFramesId(app, token, galerie.id, uuidv4());
              expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
              expect(status).toBe(404);
            });
            it('frame exist but not belong to the galerie', async () => {
              const {
                body: {
                  data: {
                    galerie,
                  },
                },
              } = await postGaleries(app, token, {
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
              } = await deleteGaleriesIdFramesId(app, token, galerieId, frame.id);
              expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
