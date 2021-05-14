import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  GalerieUser,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGaleriesIdUsersId,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
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
    describe('/users', () => {
      describe('/:userId', () => {
        describe('DELETE', () => {
          describe('should return status 200 and', () => {
            let tokenTwo: string;
            let userTwo: User;
            beforeEach(async (done) => {
              try {
                userTwo = await createUser({
                  email: 'user2@email.com',
                  userName: 'user2',
                });
                const { body } = await login(app, userTwo.email, userPassword);
                tokenTwo = body.token;
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
              } catch (err) {
                done(err);
              }
              done();
            });
            it('delete model GalerieUser', async () => {
              const {
                body: {
                  action,
                  data: {
                    galerieId: returnedGalerieId,
                    userId: returnedUserId,
                  },
                },
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const galerieUser = await GalerieUser.findOne({
                where: {
                  galerieId,
                  userId: userTwo.id,
                },
              });
              expect(action).toBe('DELETE');
              expect(galerieUser).toBeNull();
              expect(returnedGalerieId).toBe(galerieId);
              expect(returnedUserId).toBe(userTwo.id);
              expect(status).toBe(200);
            });
            it('delete all frames/galeriePictures/images/images from Google Buckets/likes relative to this frames', async () => {
              await postGaleriesIdFrames(app, tokenTwo, galerieId);
              await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              const [bucketCropedImages] = await gc
                .bucket(GALERIES_BUCKET_PP_CROP)
                .getFiles();
              const [bucketOriginalImages] = await gc
                .bucket(GALERIES_BUCKET_PP)
                .getFiles();
              const [bucketPendingImages] = await gc
                .bucket(GALERIES_BUCKET_PP_PENDING)
                .getFiles();
              const frames = await Frame.findAll();
              const galeriePicture = await GaleriePicture.findAll();
              const images = await Image.findAll();
              expect(bucketCropedImages.length).toBe(0);
              expect(bucketOriginalImages.length).toBe(0);
              expect(bucketPendingImages.length).toBe(0);
              expect(frames.length).toBe(0);
              expect(galeriePicture.length).toBe(0);
              expect(images.length).toBe(0);
            });
            it('TODO: delete all likes posted by this deleted user', async () => {});
            it('TODO: current user is creator and user with :userId is admin', async () => {});
          });
          describe('should return error 400 if', () => {
            it(':userId is the same as current user.id', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, user.id);
              expect(body.errors).toBe('you cannot delete yourself');
              expect(status).toBe(400);
            });
            it('the role of current user for this galerie is \'user\'', async () => {
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
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, tokenTwo, galerieId, user.id);
              expect(body.errors).toBe('you should be an admin or the creator of this galerie to delete a user');
              expect(status).toBe(400);
            });
            it('TODO: user with :userId is the creator of this galerie', async () => {});
            it('TODO: user with :userId is an admin and current user is an admin', async () => {});
          });
          describe('should return error 404 if', () => {
            it('galerie not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, '100', '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('galerie exist but current user is not subscribe to this galerie', async () => {
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
              } = await deleteGaleriesIdUsersId(app, token, galerie.id, '100');
              expect(body.errors).toBe('galerie not found');
              expect(status).toBe(404);
            });
            it('user not found', async () => {
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, '100');
              expect(body.errors).toBe('user not found');
              expect(status).toBe(404);
            });
            it('user with id === :userId is not subscribe to this galerie', async () => {
              const userTwo = await createUser({
                email: 'user2@email.com',
                userName: 'user2',
              });
              const {
                body,
                status,
              } = await deleteGaleriesIdUsersId(app, token, galerieId, userTwo.id);
              expect(body.errors).toBe('user not found');
              expect(status).toBe(404);
            });
          });
        });
      });
    });
  });
});
