import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  getGaleries,
  login,
  postGalerie,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  putGaleriesIdFramesIdGaleriePicturesId,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/galeries', () => {
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

  describe('GET', () => {
    describe('it should return status 200 and', () => {
      it('retun galeries', async () => {
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
            action,
            data: {
              galeries,
            },
          },
          status,
        } = await getGaleries(app, token);
        expect(action).toBe('GET');
        expect(galeries.length).toBe(1);
        expect(galeries[0].archived).toBe(galerie.archived);
        expect(galeries[0].createdAt).toBe(galerie.createdAt);
        expect(galeries[0].currentCoverPicture).toBe(galerie.currentCoverPicture);
        expect(galeries[0].defaultProfilePicture).toBe(galerie.defaultProfilePicture);
        expect(galeries[0].description).toBe(galerie.description);
        expect(galeries[0].id).toBe(galerie.id);
        expect(galeries[0].name).toBe(galerie.name);
        expect(galeries[0].role).toBe(galerie.role);
        expect(galeries[0].users.length).toBe(0);
        expect(status).toBe(200);
      });
      it('return a pack of 20 galeries', async () => {
        const NUM = 21;
        const numOfGaleries = new Array(NUM).fill(0);
        await Promise.all(
          numOfGaleries.map(async () => {
            const { id: galerieId } = await Galerie.create({
              archived: false,
              defaultCoverPicture: 'defaultCoverPicture',
              description: 'description',
              name: 'galerie\'s name',
            });
            await GalerieUser.create({
              galerieId,
              role: 'creator',
              userId: user.id,
            });
          }),
        );
        const {
          body: {
            data: {
              galeries: firstPack,
            },
          },
        } = await getGaleries(app, token);
        const {
          body: {
            data: {
              galeries: secondPack,
            },
          },
        } = await getGaleries(app, token, 2);
        expect(firstPack.length).toBe(20);
        expect(secondPack.length).toBe(1);
      });
      it('return subscribed galeries', async () => {
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
                id: galerieId,
              },
            },
          },
        } = await postGalerie(app, token, {
          name: 'galerie\'s name',
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
              galeries,
            },
          },
        } = await getGaleries(app, tokenTwo);
        expect(galeries.length).toBe(1);
        expect(galeries[0].id).toBe(galerieId);
      });
      it('don\'t return galerie if user is not subscribe to it', async () => {
        const userTwo = await createUser({
          email: 'user2@email.com',
          userName: 'user2',
        });
        const {
          body: {
            token: tokenTwo,
          },
        } = await login(app, userTwo.email, userPassword);
        await postGalerie(app, tokenTwo, {
          name: 'galerie\'s name',
        });
        await postGalerie(app, token, {
          name: 'galerie\'s name',
        });
        const {
          body: {
            data: {
              galeries,
            },
          },
        } = await getGaleries(app, token);
        expect(galeries.length).toBe(1);
      });
      it('include current cover picture', async () => {
        const {
          body: {
            data: {
              galerie: {
                id: galerieId,
              },
            },
          },
        } = await postGalerie(app, token, {
          name: 'galerie\'s name',
        });
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
        } = await postGaleriesIdFrames(app, token, galerieId);
        await putGaleriesIdFramesIdGaleriePicturesId(
          app,
          token,
          galerieId,
          frameId,
          galeriePictureId,
        );
        const {
          body: {
            data: {
              galeries: [{
                currentCoverPicture,
              }],
            },
          },
        } = await getGaleries(app, token);
        expect(currentCoverPicture.current).not.toBeUndefined();
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
  });
});
