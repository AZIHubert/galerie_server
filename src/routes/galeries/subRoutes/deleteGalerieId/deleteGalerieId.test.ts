import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  // Frame,
  Galerie,
  // GalerieUser,
  // GaleriePicture,
  // Image,
  User,
  // Like,
  // Invitation,
} from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_NOT_A_STRING,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
// import accEnv from '@src/helpers/accEnv';
// import gc from '@src/helpers/gc';
import {
  cleanGoogleBuckets,
  createUser,
  deleteGalerieId,
  login,
  postGalerie,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';
// const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
// const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
// const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

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
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
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
            } = await postGalerie(app, token, {
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
          } = await deleteGalerieId(app, token, galerieId, {
            name,
            password: userPassword,
          });
          const galerie = await Galerie.findByPk(galerieId);
          expect(action).toBe('DELETE');
          expect(data).toEqual({
            id: galerieId,
          });
          expect(galerie).toBeNull();
          expect(status).toBe(200);
        });
        it('TODO: destroy frames/galeriePictures/images and images from Google Bucket', async () => {});
        it('TODO: destroy likes', async () => {});
        it('TODO: destroy invitations', async () => {});
        it('TODO: destroy GalerieUser models', async () => {});
      });
      describe('should return error 400 if', () => {
        it('TODO: user\'s role is user', async () => {});
        it('TODO: user\'s role is admin', async () => {});
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
              } = await postGalerie(app, token, {
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
            } = await deleteGalerieId(app, token, galerieId, {
              password: userPassword,
            });
            expect(body.errors).toEqual({
              name: FIELD_IS_REQUIRED,
            });
            expect(status).toBe(400);
          });
          it('is not a string', async () => {
            const {
              body,
              status,
            } = await deleteGalerieId(app, token, galerieId, {
              name: 1234,
              password: userPassword,
            });
            expect(body.errors).toEqual({
              name: FIELD_NOT_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await deleteGalerieId(app, token, galerieId, {
              name: '',
              password: userPassword,
            });
            expect(body.errors).toEqual({
              name: FIELD_IS_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not match galerie\'s name', async () => {
            const {
              body,
              status,
            } = await deleteGalerieId(app, token, galerieId, {
              name: `wrong${name}`,
              password: userPassword,
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
              } = await postGalerie(app, token, {
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
            } = await deleteGalerieId(app, token, galerieId, {
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
            } = await deleteGalerieId(app, token, galerieId, {
              name,
              password: 1234,
            });
            expect(body.errors).toEqual({
              password: FIELD_NOT_A_STRING,
            });
            expect(status).toBe(400);
          });
          it('is an empty string', async () => {
            const {
              body,
              status,
            } = await deleteGalerieId(app, token, galerieId, {
              name,
              password: '',
            });
            expect(body.errors).toEqual({
              password: FIELD_IS_EMPTY,
            });
            expect(status).toBe(400);
          });
          it('not match user\'s password', async () => {
            const {
              body,
              status,
            } = await deleteGalerieId(app, token, galerieId, {
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
          } = await deleteGalerieId(app, token, '100', {
            name: 'galerie\'s name',
            password: userPassword,
          });
          expect(body.errors).toBe('galerie not found');
          expect(status).toBe(404);
        });
      });
    });
  });
});
