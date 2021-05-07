import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  GaleriePicture,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  login,
  postGalerie,
  postGaleriesIdFrames,
  putGaleriesIdFramesIdGaleriePicturesId,
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
        describe('/galeriePictures', () => {
          describe('/:galeriePicturesId', () => {
            describe('PUT', () => {
              describe('should return status 200 and', () => {
                let frameId: string;
                let galeriePictureId: string;
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
                    galeriePictureId = frame.galeriePictures[0].id;
                  } catch (err) {
                    done(err);
                  }
                  done();
                });
                it('should set galeriePicture\'s coverPicture to true', async () => {
                  const {
                    body: {
                      action,
                      data: {
                        frameId: returnedFrameId,
                        galerieId: returnedGalerieId,
                        galeriePicture,
                      },
                    },
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frameId,
                    galeriePictureId,
                  );
                  expect(action).toBe('PUT');
                  expect(returnedFrameId).toBe(String(frameId));
                  expect(returnedGalerieId).toBe(galerieId);
                  expect(galeriePicture.coverPicture).toBeTruthy();
                  expect(galeriePicture.createdAt).toBeUndefined();
                  expect(galeriePicture.cropedImageId).toBeUndefined();
                  expect(galeriePicture.cropedImage.bucketName).toBeUndefined();
                  expect(galeriePicture.cropedImage.createdAt).toBeUndefined();
                  expect(galeriePicture.cropedImage.fileName).toBeUndefined();
                  expect(galeriePicture.cropedImage.format).not.toBeUndefined();
                  expect(galeriePicture.cropedImage.height).not.toBeUndefined();
                  expect(galeriePicture.cropedImage.id).toBeUndefined();
                  expect(galeriePicture.cropedImage.signedUrl).not.toBeUndefined();
                  expect(galeriePicture.cropedImage.size).not.toBeUndefined();
                  expect(galeriePicture.cropedImage.updatedAt).toBeUndefined();
                  expect(galeriePicture.cropedImage.width).not.toBeUndefined();
                  expect(galeriePicture.frameId).toBeUndefined();
                  expect(galeriePicture.id).not.toBeUndefined();
                  expect(galeriePicture.index).not.toBeUndefined();
                  expect(galeriePicture.originalImageId).toBeUndefined();
                  expect(galeriePicture.originalImage.bucketName).toBeUndefined();
                  expect(galeriePicture.originalImage.createdAt).toBeUndefined();
                  expect(galeriePicture.originalImage.fileName).toBeUndefined();
                  expect(galeriePicture.originalImage.format).not.toBeUndefined();
                  expect(galeriePicture.originalImage.height).not.toBeUndefined();
                  expect(galeriePicture.originalImage.id).toBeUndefined();
                  expect(galeriePicture.originalImage.signedUrl).not.toBeUndefined();
                  expect(galeriePicture.originalImage.size).not.toBeUndefined();
                  expect(galeriePicture.originalImage.updatedAt).toBeUndefined();
                  expect(galeriePicture.originalImage.width).not.toBeUndefined();
                  expect(galeriePicture.pendingImageId).toBeUndefined();
                  expect(galeriePicture.pendingImage.bucketName).toBeUndefined();
                  expect(galeriePicture.pendingImage.createdAt).toBeUndefined();
                  expect(galeriePicture.pendingImage.fileName).toBeUndefined();
                  expect(galeriePicture.pendingImage.format).not.toBeUndefined();
                  expect(galeriePicture.pendingImage.height).not.toBeUndefined();
                  expect(galeriePicture.pendingImage.id).toBeUndefined();
                  expect(galeriePicture.pendingImage.signedUrl).not.toBeUndefined();
                  expect(galeriePicture.pendingImage.size).not.toBeUndefined();
                  expect(galeriePicture.pendingImage.updatedAt).toBeUndefined();
                  expect(galeriePicture.pendingImage.width).not.toBeUndefined();
                  expect(galeriePicture.updatedAt).toBeUndefined();
                  expect(status).toBe(200);
                });
                it('should set galeriePicture\'s coverPicture to true', async () => {
                  await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frameId,
                    galeriePictureId,
                  );
                  await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frameId,
                    galeriePictureId,
                  );
                  const galeriePicture = await GaleriePicture
                    .findByPk(galeriePictureId) as GaleriePicture;
                  expect(galeriePicture.coverPicture).toBeFalsy();
                });
                it('should set coverPicture to true and the previous one to false', async () => {
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
                        frame,
                      },
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frame.id,
                    frame.galeriePictures[0].id,
                  );
                  const galeriePicture = await GaleriePicture
                    .findByPk(galeriePictureId) as GaleriePicture;
                  expect(galeriePicture.coverPicture).toBeFalsy();
                });
              });
              describe('should return status 400 if', () => {
                it('TODO: user\'s role is \'user\'', async () => {});
              });
              describe('should return status 404 if', () => {
                it('galerie doesn\'t exist', async () => {
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    '100',
                    '100',
                    '100',
                  );
                  expect(body.errors).toBe('galerie not found');
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
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerie.id,
                    '100',
                    '100',
                  );
                  expect(body.errors).toBe('galerie not found');
                  expect(status).toBe(404);
                });
                it('frame doesn\'t exist', async () => {
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    '100',
                    '100',
                  );
                  expect(body.errors).toBe('frame not found');
                  expect(status).toBe(404);
                });
                it('frame exist but not below to galerie with :id', async () => {
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
                    body: {
                      data: {
                        frame,
                      },
                    },
                  } = await postGaleriesIdFrames(app, tokenTwo, galerie.id);
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frame.id,
                    '100',
                  );
                  expect(body.errors).toBe('frame not found');
                  expect(status).toBe(404);
                });
                it('galerie picture doesn\'t exist', async () => {
                  const {
                    body: {
                      data: {
                        frame,
                      },
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frame.id,
                    '100',
                  );
                  expect(body.errors).toBe('galerie picture not found');
                  expect(status).toBe(404);
                });
                it('galerie picture exist but not below to frame with :frameId', async () => {
                  const {
                    body: {
                      data: {
                        frame: frameOne,
                      },
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  const {
                    body: {
                      data: {
                        frame: frameTwo,
                      },
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frameOne.id,
                    frameTwo.galeriePictures[0].id,
                  );
                  expect(body.errors).toBe('galerie picture not found');
                  expect(status).toBe(404);
                });
              });
            });
          });
        });
      });
    });
  });
});
