import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '#src/helpers/initEnv';

import {
  GaleriePicture,
  User,
} from '#src/db/models';

import {
  INVALID_UUID,
  MODEL_NOT_FOUND,
} from '#src/helpers/errorMessages';
import initSequelize from '#src/helpers/initSequelize.js';
import { signAuthToken } from '#src/helpers/issueJWT';
import signedUrl from '#src/helpers/signedUrl';
import {
  createFrame,
  createGalerie,
  createGalerieUser,
  createUser,
  putGaleriesIdFramesIdGaleriePicturesId,
} from '#src/helpers/test';

import initApp from '#src/server';

let app: Server;
let galerieId: string;
let sequelize: Sequelize;
let token: string;
let user: User;

jest.mock('#src/helpers/signedUrl', () => jest.fn());

describe('/galeries', () => {
  describe('/:galerieId', () => {
    describe('/frames', () => {
      describe('/:frameId', () => {
        describe('/galeriePictures', () => {
          describe('/:galeriePicturesId', () => {
            describe('PUT', () => {
              beforeAll(() => {
                sequelize = initSequelize();
                app = initApp();
              });

              beforeEach(async (done) => {
                jest.clearAllMocks();
                (signedUrl as jest.Mock).mockImplementation(() => ({
                  OK: true,
                  signedUrl: 'signedUrl',
                }));
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
                jest.clearAllMocks();
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
                let galeriePictureId: string;

                beforeEach(async (done) => {
                  try {
                    const frame = await createFrame({
                      galerieId,
                      userId: user.id,
                    });
                    frameId = frame.id;
                    galeriePictureId = frame.galeriePictures[0].id;
                  } catch (err) {
                    done(err);
                  }
                  done();
                });

                it('set galeriePicture\'s current to true', async () => {
                  const {
                    body: {
                      action,
                      data: {
                        current,
                        frameId: returnedFrameId,
                        galerieId: returnedGalerieId,
                        galeriePictureId: returnedGaleriePictureId,
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
                  const galeriePicture = await GaleriePicture
                    .findByPk(galeriePictureId) as GaleriePicture;
                  expect(action).toBe('PUT');
                  expect(current).toBe(true);
                  expect(galeriePicture.current).toBe(true);
                  expect(returnedFrameId).toBe(frameId);
                  expect(returnedGalerieId).toBe(galerieId);
                  expect(returnedGaleriePictureId).toBe(galeriePictureId);
                  expect(status).toBe(200);
                });
                it('set galeriePicture\'s current to false', async () => {
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
                        current,
                      },
                    },
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frameId,
                    galeriePictureId,
                  );
                  const galeriePicture = await GaleriePicture
                    .findByPk(galeriePictureId) as GaleriePicture;
                  expect(current).toBe(false);
                  expect(galeriePicture.current).toBe(false);
                });
                it('set coverPicture to true and the previous one to false', async () => {
                  await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frameId,
                    galeriePictureId,
                  );
                  const frame = await createFrame({
                    galerieId,
                    userId: user.id,
                  });
                  await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frame.id,
                    frame.galeriePictures[0].id,
                  );
                  const coverPicture = await GaleriePicture
                    .findByPk(frame.galeriePictures[0].id) as GaleriePicture;
                  const galeriePicture = await GaleriePicture
                    .findByPk(galeriePictureId) as GaleriePicture;
                  expect(coverPicture.current).toBe(true);
                  expect(galeriePicture.current).toBe(false);
                });
                it('put galeriePicture if user is an admin of this galerie', async () => {
                  const { user: userTwo } = await createUser({
                    email: 'user2@email.com',
                    userName: 'user2',
                  });
                  const { token: tokenTwo } = signAuthToken(userTwo);
                  await createGalerieUser({
                    galerieId,
                    role: 'admin',
                    userId: userTwo.id,
                  });
                  const { status } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    tokenTwo,
                    galerieId,
                    frameId,
                    galeriePictureId,
                  );
                  expect(status).toBe(200);
                });
              });
              describe('should return status 400 if', () => {
                it('request.params.galerieId is not a UUID v4', async () => {
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    '100',
                    uuidv4(),
                    uuidv4(),
                  );
                  expect(body.errors).toBe(INVALID_UUID('galerie'));
                  expect(status).toBe(400);
                });
                it('request.params.frameId is not a UUID v4', async () => {
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    uuidv4(),
                    '100',
                    uuidv4(),
                  );
                  expect(body.errors).toBe(INVALID_UUID('frame'));
                  expect(status).toBe(400);
                });
                it('request.params.galeriePictureId is not a UUID v4', async () => {
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    uuidv4(),
                    uuidv4(),
                    '100',
                  );
                  expect(body.errors).toBe(INVALID_UUID('galerie picture'));
                  expect(status).toBe(400);
                });
                it('user\'s role is \'user\'', async () => {
                  const {
                    user: userTwo,
                  } = await createUser({
                    email: 'user2@email.com',
                    userName: 'user2',
                  });
                  const { token: tokenTwo } = signAuthToken(userTwo);
                  await createGalerieUser({
                    galerieId,
                    userId: userTwo.id,
                  });
                  const frame = await createFrame({
                    galerieId,
                    userId: user.id,
                  });
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    tokenTwo,
                    galerieId,
                    frame.id,
                    frame.galeriePictures[0].id,
                  );
                  expect(body.errors).toBe('your\'re not allow to update this frame');
                  expect(status).toBe(400);
                });
                it('galerie is archived', async () => {
                  const galerieTwo = await createGalerie({
                    archived: true,
                    name: 'galerie2',
                    userId: user.id,
                  });
                  const frame = await createFrame({
                    galerieId: galerieTwo.id,
                    userId: user.id,
                  });
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieTwo.id,
                    frame.id,
                    frame.galeriePictures[0].id,
                  );
                  expect(body.errors).toBe('you cannot update an archived galerie');
                  expect(status).toBe(400);
                });
              });
              describe('should return status 404 if', () => {
                it('galerie doesn\'t exist', async () => {
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    uuidv4(),
                    uuidv4(),
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
                  expect(status).toBe(404);
                });
                it('galerie exist but user is not subscribe to it', async () => {
                  const {
                    user: userTwo,
                  } = await createUser({
                    email: 'user2@email.com',
                    userName: 'user2',
                  });
                  const galerie = await createGalerie({
                    name: 'galerie2',
                    userId: userTwo.id,
                  });
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerie.id,
                    uuidv4(),
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
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
                    uuidv4(),
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                  expect(status).toBe(404);
                });
                it('frame exist but not below to galerie with :id', async () => {
                  const {
                    user: userTwo,
                  } = await createUser({
                    email: 'user2@email.com',
                    userName: 'user2',
                  });
                  const galerie = await createGalerie({
                    name: 'galerie2',
                    userId: userTwo.id,
                  });
                  const frame = await createFrame({
                    galerieId: galerie.id,
                    userId: userTwo.id,
                  });
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frame.id,
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
                  expect(status).toBe(404);
                });
                it('galerie picture doesn\'t exist', async () => {
                  const frame = await createFrame({
                    galerieId,
                    userId: user.id,
                  });
                  const {
                    body,
                    status,
                  } = await putGaleriesIdFramesIdGaleriePicturesId(
                    app,
                    token,
                    galerieId,
                    frame.id,
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('galerie picture'));
                  expect(status).toBe(404);
                });
                it('galerie picture exist but not below to frame with :frameId', async () => {
                  const frameOne = await createFrame({
                    galerieId,
                    userId: user.id,
                  });
                  const frameTwo = await createFrame({
                    galerieId,
                    userId: user.id,
                  });
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
                  expect(body.errors).toBe(MODEL_NOT_FOUND('galerie picture'));
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
