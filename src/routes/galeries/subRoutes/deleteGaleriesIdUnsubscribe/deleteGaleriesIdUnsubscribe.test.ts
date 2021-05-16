import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  Like,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGaleriesUnsubscribe,
  deleteUser,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdFramesIdLikes,
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
  let tokenTwo: string;
  let user: User;
  let userTwo: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await cleanGoogleBuckets();
      await sequelize.sync({ force: true });

      user = await createUser({});
      userTwo = await createUser({
        email: 'user2@email.com',
        userName: 'user2',
      });

      const { body } = await login(app, user.email, userPassword);
      const { body: bodyTwo } = await login(app, userTwo.email, userPassword);
      token = body.token;
      tokenTwo = bodyTwo.token;

      const {
        body: {
          data: {
            galerie: {
              id,
            },
          },
        },
      } = await postGalerie(app, tokenTwo, {
        name: 'galerie\'s name',
      });
      galerieId = id;
      const {
        body: {
          data: {
            invitation: {
              code,
            },
          },
        },
      } = await postGaleriesIdInvitations(app, tokenTwo, galerieId, {});
      await postGaleriesSubscribe(app, token, {
        code,
      });
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
    describe('/unsubscribe', () => {
      describe('should return status 200 and', () => {
        it('destroy GalerieUser model', async () => {
          const {
            body: {
              action,
              data,
            },
            status,
          } = await deleteGaleriesUnsubscribe(app, token, galerieId);
          const galerieUser = await GalerieUser.findOne({
            where: {
              galerieId,
              userId: user.id,
            },
          });
          expect(action).toBe('DELETE');
          expect(data).toEqual({
            galerieId,
          });
          expect(galerieUser).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy all frames/galerie pictures/images/images from GB posted by this user', async () => {
          await postGaleriesIdFrames(app, token, galerieId);
          await deleteGaleriesUnsubscribe(app, token, galerieId);
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
          const galeriePictures = await GaleriePicture.findAll();
          const images = await Image.findAll();
          expect(bucketCropedImages.length).toBe(0);
          expect(bucketOriginalImages.length).toBe(0);
          expect(bucketPendingImages.length).toBe(0);
          expect(frames.length).toBe(0);
          expect(galeriePictures.length).toBe(0);
          expect(images.length).toBe(0);
        });
        it('destroy all likes to frames posted by deleted user', async () => {
          const {
            body: {
              data: {
                frame: {
                  id: frameId,
                },
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          await postGaleriesIdFramesIdLikes(app, tokenTwo, galerieId, frameId);
          await deleteGaleriesUnsubscribe(app, token, galerieId);
          const like = await Like.findOne({
            where: {
              frameId,
            },
          });
          expect(like).toBeNull();
        });
        it('destroy all likes posted by this user', async () => {
          const {
            body: {
              data: {
                frame: {
                  id: frameId,
                },
              },
            },
          } = await postGaleriesIdFrames(app, tokenTwo, galerieId);
          await postGaleriesIdFramesIdLikes(app, token, galerieId, frameId);
          await deleteGaleriesUnsubscribe(app, token, galerieId);
          const like = await Like.findOne({
            where: {
              frameId,
            },
          });
          expect(like).toBeNull();
        });
        it('and delete galerie if they\'re no user left', async () => {
          await deleteUser(app, tokenTwo, {
            deleteAccountSentence: 'delete my account',
            password: userPassword,
            userNameOrEmail: userTwo.email,
          });
          await postGaleriesIdFrames(app, token, galerieId);
          await deleteGaleriesUnsubscribe(app, token, galerieId);
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
          const galeries = await Galerie.findAll();
          const galeriePictures = await GaleriePicture.findAll();
          const images = await Image.findAll();
          expect(bucketCropedImages.length).toBe(0);
          expect(bucketOriginalImages.length).toBe(0);
          expect(bucketPendingImages.length).toBe(0);
          expect(frames.length).toBe(0);
          expect(galeries.length).toBe(0);
          expect(galeriePictures.length).toBe(0);
          expect(images.length).toBe(0);
        });
        it('and do not delete galerie if they are users left', async () => {
          await deleteGaleriesUnsubscribe(app, token, galerieId);
          const galeries = await Galerie.findByPk(galerieId);
          expect(galeries).not.toBeNull();
        });
      });
      describe('should return error 400 if', () => {
        it('current user is the creator of this galerie', async () => {
          const {
            body,
            status,
          } = await deleteGaleriesUnsubscribe(app, tokenTwo, galerieId);
          expect(body.errors).toBe('you cannot unsubscribe a galerie you\'ve created');
          expect(status).toBe(400);
        });
      });
      describe('should return error 404 if', () => {
        it('galerie not found', async () => {
          const {
            body,
            status,
          } = await deleteGaleriesUnsubscribe(app, tokenTwo, '100');
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
        it('galerie exist but user is not subscribe to it', async () => {
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
          } = await deleteGaleriesUnsubscribe(app, token, galerie.id);
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
