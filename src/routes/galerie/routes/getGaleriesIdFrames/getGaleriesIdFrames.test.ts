import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GalerieUser,
  GaleriePicture,
  Image,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import accEnv from '@src/helpers/accEnv';
import initApp from '@src/server';
import gc from '@src/helpers/gc';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async (sequelize: Sequelize) => {
  await Frame.sync({ force: true });
  await Galerie.sync({ force: true });
  await GaleriePicture.sync({ force: true });
  await GalerieUser.sync({ force: true });
  await Image.sync({ force: true });
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
  const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
  await Promise.all(originalImages
    .map(async (image) => {
      await image.delete();
    }));
  const [cropedImages] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
  await Promise.all(cropedImages
    .map(async (image) => {
      await image.delete();
    }));
  const [pendingImages] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
  await Promise.all(pendingImages
    .map(async (image) => {
      await image.delete();
    }));
};

const newUser = {
  pseudonym: 'userName',
  email: 'user@email.com',
  password: 'password',
  userName: '@userName',
};

describe('galeries', () => {
  let sequelize: Sequelize;
  let app: Server;
  let user: User;
  let agent: request.SuperAgentTest;
  let token: string;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
    agent = request.agent(app);
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await cleanDatas(sequelize);
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      const { body } = await agent
        .post('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.email,
        });
      token = body.token;
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await cleanDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe(':id', () => {
    describe('frames', () => {
      describe('POST', () => {
        describe('should return status 200 and', () => {
          it('should return the galerie\'s id', async () => {
            const {
              body: {
                galerie: {
                  id: galerieId,
                },
              },
            } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const {
              body: {
                galerieId: getGalerieId,
              },
              status,
            } = await agent
              .get(`/galeries/${galerieId}/frames`)
              .set('authorization', token);
            expect(status).toEqual(200);
            expect(getGalerieId).toEqual(galerieId);
          });
          it('return no frame', async () => {
            const {
              body: {
                galerie: {
                  id: galerieId,
                },
              },
            } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const {
              body: {
                frames,
              },
              status,
            } = await agent
              .get(`/galeries/${galerieId}/frames`)
              .set('authorization', token);
            expect(status).toEqual(200);
            expect(frames.length).toEqual(0);
          });
          it('return one frame', async () => {
            const {
              body: {
                galerie: {
                  id: galerieId,
                },
              },
            } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const {
              body: {
                frame: {
                  id: frameId,
                },
              },
            } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('images', `${__dirname}/../../ressources/image.jpg`);
            const {
              body: {
                frames,
              },
              status,
            } = await agent
              .get(`/galeries/${galerieId}/frames`)
              .set('authorization', token);
            expect(status).toEqual(200);
            expect(frames.length).toEqual(1);
            const [frame] = frames;
            expect(frame.id).toEqual(frameId);
            expect(frame.galeriePictures[0].cropedImage.signedUrl).not.toBeNull();
            expect(frame.galeriePictures[0].originalImage.signedUrl).not.toBeNull();
            expect(frame.galeriePictures[0].pendingImage.signedUrl).not.toBeNull();
          });
          it('return five frames', async () => {
            const {
              body: {
                galerie: {
                  id: galerieId,
                },
              },
            } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('images', `${__dirname}/../../ressources/image.jpg`);
            await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('images', `${__dirname}/../../ressources/image.jpg`);
            await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('images', `${__dirname}/../../ressources/image.jpg`);
            await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('images', `${__dirname}/../../ressources/image.jpg`);
            await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('images', `${__dirname}/../../ressources/image.jpg`);
            const {
              body: {
                frames,
              },
              status,
            } = await agent
              .get(`/galeries/${galerieId}/frames`)
              .set('authorization', token);
            expect(status).toEqual(200);
            expect(frames.length).toEqual(5);
          });
        });
        describe('should return error 404 if', () => {
          it('galerie not found', async () => {
            const { body, status } = await agent
              .get('/galeries/1/frames')
              .set('authorization', token);
            expect(status).toEqual(404);
            expect(body).toStrictEqual({
              errors: 'galerie not found',
            });
          });
        });
      });
    });
  });
});
