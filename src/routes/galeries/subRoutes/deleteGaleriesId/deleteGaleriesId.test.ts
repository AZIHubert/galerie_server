import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GaleriePicture,
  GalerieUser,
  Image,
  Invitation,
  Like,
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_SHOULD_BE_A_STRING,
  INVALID_UUID,
  MODEL_NOT_FOUND,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGaleriesId,
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

describe('/galeries', () => {
  let app: Server;
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
      } = await createUser({});

      password = createdPassword;
      user = createdUser;

      const { body } = await postUsersLogin(app, {
        body: {
          password,
          userNameOrEmail: user.email,
        },
      });
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

  describe('/:galerieId', () => {
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
        const name = 'galerie\'s name';
        let galerieId: string;
        beforeEach(async (done) => {
          try {
            const {
              body: {
                data: {
                  galerie: {
                    id,
                  },
                },
              },
            } = await postGaleries(app, token, {
              name,
            });
            galerieId = id;
          } catch (err) {
            done(err);
          }
          done();
        });
        it('destroy galerie', async () => {
          const {
            body: {
              action,
              data,
            },
            status,
          } = await deleteGaleriesId(app, token, galerieId, {
            name,
            password,
          });
          const galerie = await Galerie.findByPk(galerieId);
          expect(action).toBe('DELETE');
          expect(data).toEqual({
            galerieId,
          });
          expect(galerie).toBeNull();
          expect(status).toBe(200);
        });
        it('destroy frames/galeriePictures/images and images from Google Bucket', async () => {
          const {
            body: {
              data: {
                frame: {
                  id: frameId,
                },
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          await deleteGaleriesId(app, token, galerieId, {
            name,
            password,
          });
          const [bucketCropedImages] = await gc
            .bucket(GALERIES_BUCKET_PP_CROP)
            .getFiles();
          const [bucketOriginalImages] = await gc
            .bucket(GALERIES_BUCKET_PP)
            .getFiles();
          const [bucketPendingImages] = await gc
            .bucket(GALERIES_BUCKET_PP_PENDING)
            .getFiles();
          const frames = await Frame.findAll({
            where: {
              galerieId,
            },
          });
          const galeriePictures = await GaleriePicture.findAll({
            where: {
              frameId,
            },
          });
          const images = await Image.findAll();
          expect(bucketCropedImages.length).toBe(0);
          expect(bucketOriginalImages.length).toBe(0);
          expect(bucketPendingImages.length).toBe(0);
          expect(frames.length).toBe(0);
          expect(galeriePictures.length).toBe(0);
          expect(images.length).toBe(0);
        });
        it('destroy invitations', async () => {
          await postGaleriesIdInvitations(app, token, galerieId, {});
          await deleteGaleriesId(app, token, galerieId, {
            name,
            password,
          });
          const invitations = await Invitation.findAll({
            where: {
              galerieId,
            },
          });
          expect(invitations.length).toBe(0);
        });
        it('destroy likes', async () => {
          const {
            body: {
              data: {
                frame,
              },
            },
          } = await postGaleriesIdFrames(app, token, galerieId);
          await postGaleriesIdFramesIdLikes(app, token, galerieId, frame.id);
          await deleteGaleriesId(app, token, galerieId, {
            name,
            password,
          });
          const likes = await Like.findAll();
          expect(likes.length).toBe(0);
        });
        it('destroy GalerieUser models', async () => {
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
          await deleteGaleriesId(app, token, galerieId, {
            name,
            password,
          });
          const galerieUsers = await GalerieUser.findAll();
          expect(galerieUsers.length).toBe(0);
        });
      });
      describe('should return status 400 if', () => {
        it('request.params.galerieId is not a UUID v4', async () => {
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, '100', {});
          expect(body.errors).toBe(INVALID_UUID('galerie'));
          expect(status).toBe(400);
        });
        it('user\'s role is user', async () => {
          const name = 'galerie\'s name';
          const {
            body: {
              data: {
                galerie,
              },
            },
          } = await postGaleries(app, token, {
            name,
          });
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
          } = await postGaleriesIdInvitations(app, token, galerie.id, {});
          await postGaleriesSubscribe(app, tokenTwo, { code });
          const {
            body,
            status,
          } = await deleteGaleriesId(app, tokenTwo, galerie.id, {
            name,
            password: passwordTwo,
          });
          expect(body.errors).toBe('not allow to delete this galerie');
          expect(status).toBe(400);
        });
        it('user\'s role is admin', async () => {
          const name = 'galerie\'s name';
          const {
            body: {
              data: {
                galerie,
              },
            },
          } = await postGaleries(app, token, {
            name,
          });
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
          } = await postGaleriesIdInvitations(app, token, galerie.id, {});
          await postGaleriesSubscribe(app, tokenTwo, { code });
          await putGaleriesIdUsersId(app, token, galerie.id, userTwo.id);
          const {
            body,
            status,
          } = await deleteGaleriesId(app, tokenTwo, galerie.id, {
            name,
            password: passwordTwo,
          });
          expect(body.errors).toBe('not allow to delete this galerie');
          expect(status).toBe(400);
        });
        describe('name', () => {
          let galerieId: string;
          const name = 'galerie\'s name';
          beforeEach(async (done) => {
            try {
              const {
                body: {
                  data: {
                    galerie: {
                      id,
                    },
                  },
                },
              } = await postGaleries(app, token, {
                name,
              });
              galerieId = id;
            } catch (err) {
              done(err);
            }
            done();
          });
          it('is not send', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, { password });
            expect(body.errors).toEqual({
              name: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name: 1234,
              password,
            });
            expect(body.errors).toEqual({
              name: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name: '',
              password,
            });
            expect(body.errors).toEqual({
              name: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not match galerie\'s name', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name: `wrong${name}`,
              password,
            });
            expect(body.errors).toEqual({
              name: 'wrong galerie\'s name',
            });
            expect(status).toBe(400);
          });
        });
        describe('password', () => {
          let galerieId: string;
          const name = 'galerie\'s name';
          beforeEach(async (done) => {
            try {
              const {
                body: {
                  data: {
                    galerie: {
                      id,
                    },
                  },
                },
              } = await postGaleries(app, token, {
                name,
              });
              galerieId = id;
            } catch (err) {
              done(err);
            }
            done();
          });
          it('is not send', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name,
            });
            expect(body.errors).toEqual({
              password: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name,
              password: 1234,
            });
            expect(body.errors).toEqual({
              password: FIELD_SHOULD_BE_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name,
              password: '',
            });
            expect(body.errors).toEqual({
              password: FIELD_CANNOT_BE_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not match user\'s password', async () => {
            const {
              body,
              status,
            } = await deleteGaleriesId(app, token, galerieId, {
              name,
              password: 'wrongPassword',
            });
            expect(body.errors).toEqual({
              password: WRONG_PASSWORD,
            });
            expect(status).toBe(400);
          });
        });
      });
      describe('should return error 404 if', () => {
        it('galerie doesn\'t exist', async () => {
          const {
            body,
            status,
          } = await deleteGaleriesId(app, token, uuidv4(), {
            name: 'galerie\'s name',
            password,
          });
          expect(body.errors).toBe(MODEL_NOT_FOUND('galerie'));
          expect(status).toBe(404);
        });
      });
    });
  });
});
