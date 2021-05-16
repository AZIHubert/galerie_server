import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleriesId,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  putGaleriesIdFramesIdGaleriePicturesId,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('galeries', () => {
  let app: Server;
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
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
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

  describe(':id', () => {
    describe('GET', () => {
      describe('it should return status 200 and', () => {
        let returnedGalerie: any;
        beforeEach(async (done) => {
          try {
            const {
              body: {
                data: {
                  galerie,
                },
              },
            } = await postGalerie(app, token, {
              name: 'galerie\'s name',
            });
            returnedGalerie = galerie;
          } catch (err) {
            done(err);
          }
          done();
        });
        it('return galerie if user is the creator', async () => {
          const {
            body: {
              action,
              data: {
                galerie,
              },
            },
            status,
          } = await getGaleriesId(app, token, returnedGalerie.id);
          expect(action).toBe('GET');
          expect(galerie.archived).toBe(returnedGalerie.archived);
          expect(galerie.createdAt).toBe(returnedGalerie.createdAt);
          expect(galerie.currentCoverPicture).toBe(returnedGalerie.currentCoverPicture);
          expect(galerie.defaultCoverPicture).toBe(returnedGalerie.defaultCoverPicture);
          expect(galerie.id).toBe(returnedGalerie.id);
          expect(galerie.name).toBe(returnedGalerie.name);
          expect(galerie.role).toBe(returnedGalerie.role);
          expect(galerie.updatedAt).toBeUndefined();
          expect(galerie.users.length).toBe(0);
          expect(status).toBe(200);
        });
        it('return galerie if user is subscribe to it', async () => {
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
          } = await postGaleriesIdInvitations(app, token, returnedGalerie.id, {});
          await postGaleriesSubscribe(app, tokenTwo, { code });
          const { status } = await getGaleriesId(app, tokenTwo, returnedGalerie.id);
          expect(status).toBe(200);
        });
        it('include current profile picture', async () => {
          const {
            body: {
              data: {
                frame: {
                  id: frameId,
                  galeriePictures: [{
                    id: galeriePictureId,
                  }],
                },
              },
            },
          } = await postGaleriesIdFrames(app, token, returnedGalerie.id);
          await putGaleriesIdFramesIdGaleriePicturesId(
            app,
            token,
            returnedGalerie.id,
            frameId,
            galeriePictureId,
          );
          const {
            body: {
              data: {
                galerie: {
                  currentCoverPicture,
                },
              },
            },
          } = await getGaleriesId(app, token, returnedGalerie.id);
          expect(currentCoverPicture.coverPicture).not.toBeUndefined();
          expect(currentCoverPicture.createdAt).toBeUndefined();
          expect(currentCoverPicture.cropedImageId).toBeUndefined();
          expect(currentCoverPicture.cropedImage.bucketName).toBeUndefined();
          expect(currentCoverPicture.cropedImage.createdAt).toBeUndefined();
          expect(currentCoverPicture.cropedImage.fileName).toBeUndefined();
          expect(currentCoverPicture.cropedImage.format).not.toBeUndefined();
          expect(currentCoverPicture.cropedImage.height).not.toBeUndefined();
          expect(currentCoverPicture.cropedImage.id).toBeUndefined();
          expect(currentCoverPicture.cropedImage.signedUrl).not.toBeUndefined();
          expect(currentCoverPicture.cropedImage.size).not.toBeUndefined();
          expect(currentCoverPicture.cropedImage.updatedAt).toBeUndefined();
          expect(currentCoverPicture.cropedImage.width).not.toBeUndefined();
          expect(currentCoverPicture.frameId).toBeUndefined();
          expect(currentCoverPicture.id).not.toBeUndefined();
          expect(currentCoverPicture.index).not.toBeUndefined();
          expect(currentCoverPicture.originalImageId).toBeUndefined();
          expect(currentCoverPicture.originalImage.bucketName).toBeUndefined();
          expect(currentCoverPicture.originalImage.createdAt).toBeUndefined();
          expect(currentCoverPicture.originalImage.fileName).toBeUndefined();
          expect(currentCoverPicture.originalImage.format).not.toBeUndefined();
          expect(currentCoverPicture.originalImage.height).not.toBeUndefined();
          expect(currentCoverPicture.originalImage.id).toBeUndefined();
          expect(currentCoverPicture.originalImage.signedUrl).not.toBeUndefined();
          expect(currentCoverPicture.originalImage.size).not.toBeUndefined();
          expect(currentCoverPicture.originalImage.updatedAt).toBeUndefined();
          expect(currentCoverPicture.originalImage.width).not.toBeUndefined();
          expect(currentCoverPicture.pendingImageId).toBeUndefined();
          expect(currentCoverPicture.pendingImage.bucketName).toBeUndefined();
          expect(currentCoverPicture.pendingImage.createdAt).toBeUndefined();
          expect(currentCoverPicture.pendingImage.fileName).toBeUndefined();
          expect(currentCoverPicture.pendingImage.format).not.toBeUndefined();
          expect(currentCoverPicture.pendingImage.height).not.toBeUndefined();
          expect(currentCoverPicture.pendingImage.id).toBeUndefined();
          expect(currentCoverPicture.pendingImage.signedUrl).not.toBeUndefined();
          expect(currentCoverPicture.pendingImage.size).not.toBeUndefined();
          expect(currentCoverPicture.pendingImage.updatedAt).toBeUndefined();
          expect(currentCoverPicture.pendingImage.width).not.toBeUndefined();
          expect(currentCoverPicture.updatedAt).toBeUndefined();
        });
      });
      describe('it should return error 404 if', () => {
        it('galerie id doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await getGaleriesId(app, token, '100');
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
        it('galerie exist but user is not subscribe to it or the creator', async () => {
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
                galerie: {
                  id,
                },
              },
            },
          } = await postGalerie(app, tokenTwo, {
            name: 'galerie\'s name',
          });
          const {
            body,
            status,
          } = await getGaleriesId(app, token, id);
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
