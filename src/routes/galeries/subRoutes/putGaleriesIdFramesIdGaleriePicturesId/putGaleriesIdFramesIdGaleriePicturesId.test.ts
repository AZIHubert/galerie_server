import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  GaleriePicture,
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
  deleteUsersMe,
  postGaleries,
  postGaleriesIdFrames,
  postGaleriesIdInvitations,
  postGaleriesSubscribe,
  postUsersLogin,
  putGaleriesIdFramesIdGaleriePicturesId,
  putGaleriesIdUsersId,
} from '@src/helpers/test';

import initApp from '@src/server';

describe('/galeries', () => {
  let app: Server;
  let galerieId: string;
  let password: string;
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
        password: createdPassword,
        user: createdUser,
      } = await createUser({
        role: 'superAdmin',
      });

      password = createdPassword;
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

  describe('/:galerieId', () => {
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

                it('should set galeriePicture\'s current to true', async () => {
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
                  expect(current).toBeTruthy();
                  expect(galeriePicture.current).toBeTruthy();
                  expect(returnedFrameId).toBe(String(frameId));
                  expect(returnedGalerieId).toBe(galerieId);
                  expect(returnedGaleriePictureId).toBe(galeriePictureId);
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
                  expect(current).toBeFalsy();
                  expect(galeriePicture.current).toBeFalsy();
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
                  expect(galeriePicture.current).toBeFalsy();
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
                  } = await postGaleriesIdInvitations(app, token, galerieId, {});
                  await postGaleriesSubscribe(app, tokenTwo, { code });
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
                    tokenTwo,
                    galerieId,
                    frame.id,
                    frame.galeriePictures[0].id,
                  );
                  expect(body.errors).toBe('your\'re not allow to update this frame');
                  expect(status).toBe(400);
                });
                it('galerie is archived', async () => {
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
                  } = await postGaleriesIdInvitations(app, token, galerieId, {});
                  await postGaleriesSubscribe(app, tokenTwo, { code });
                  const {
                    body: {
                      data: {
                        frame,
                      },
                    },
                  } = await postGaleriesIdFrames(app, token, galerieId);
                  await putGaleriesIdUsersId(app, token, galerieId, userTwo.id);
                  await deleteUsersMe(app, token, {
                    body: {
                      deleteAccountSentence: 'delete my account',
                      password,
                      userNameOrEmail: user.email,
                    },
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
                    name: 'galerie\'s name',
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
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('frame'));
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
                    uuidv4(),
                  );
                  expect(body.errors).toBe(MODEL_NOT_FOUND('galerie picture'));
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
