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
  let galerieId: string;
  let pictureId: string;
  let frameId: string;
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
      const { body: createGalerieBody } = await agent
        .post('/galeries')
        .set('authorization', token)
        .send({ name: 'galerie name' });
      galerieId = createGalerieBody.id;
      const { body: createFrameBody } = await agent
        .post(`/galeries/${galerieId}/frames`)
        .set('authorization', token)
        .attach('image', `${__dirname}/../../ressources/image.jpg`)
        .attach('image', `${__dirname}/../../ressources/image.jpg`)
        .attach('image', `${__dirname}/../../ressources/image.jpg`);
      frameId = createFrameBody.id;
      pictureId = createFrameBody.galeriePictures[0].id;
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
      describe(':frameId', () => {
        describe('DELETE', () => {
          describe('it should return status 200', () => {
            it('and set to null galerie cover picture if it\'s the same as frameId', async () => {
              await agent
                .put(`/galeries/${galerieId}`)
                .set('authorization', token)
                .send({ coverPictureId: pictureId });
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const galerie = await Galerie.findByPk(galerieId);
              if (galerie) {
                expect(galerie.coverPictureId).toBeNull();
              }
            });
            it('and should keep galerie cover picture if it\'s not the same as frameId', async () => {
              const { body: createFrameBody } = await agent
                .post(`/galeries/${galerieId}/frames`)
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const pictureTwoId = createFrameBody.galeriePictures[0].id;
              await agent
                .put(`/galeries/${galerieId}`)
                .set('authorization', token)
                .send({ coverPictureId: pictureTwoId });
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const galerie = await Galerie.findByPk(galerieId);
              if (galerie) {
                expect(galerie.coverPictureId).toEqual(pictureTwoId);
              }
            });
            it('should remove all original images from Google Storage', async () => {
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
              expect(files.length).toBe(0);
            });
            it('should remove all croped images from Google Storage', async () => {
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
              expect(files.length).toBe(0);
            });
            it('should remove all pending images from Google Storage', async () => {
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
              expect(files.length).toBe(0);
            });
            it('should delete all Images', async () => {
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const images = await Image.findAll();
              expect(images.length).toEqual(0);
            });
            it('should delete the frame', async () => {
              await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              const frames = await Frame.findAll();
              expect(frames.length).toEqual(0);
            });
            it('should return deleted frameId', async () => {
              const { body } = await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', token);
              expect(+body.id).toEqual(frameId);
            });
          });
          describe('it should return error 400', () => {
            it('frame exist but not upload by this user and the user\'s role is user', async () => {
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                userName: 'user2',
                email: 'user2@email.com',
                confirmed: true,
                password: hashPassword,
              });
              await GalerieUser.create({
                userId: userTwo.id,
                galerieId,
                role: 'user',
              });
              const { body: loginUserTwo } = await agent
                .post('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.email,
                });
              const tokenTwo = loginUserTwo.token;
              const { body, status } = await agent
                .delete(`/galeries/${galerieId}/frames/${frameId}`)
                .set('authorization', tokenTwo);
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: 'not allow to delete this frame',
              });
            });
          });
          describe('it should return error 404', () => {
            it('galerie not found', async () => {
              const { body, status } = await agent
                .delete(`/galeries/100/frames/${frameId}`)
                .set('authorization', token);
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: 'galerie not found',
              });
            });
            it('galerie exist but user is not subscribe to it', async () => {
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                userName: 'user2',
                email: 'user2@email.com',
                confirmed: true,
                password: hashPassword,
              });
              const { body: loginUserTwo } = await agent
                .post('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.email,
                });
              const tokenTwo = loginUserTwo.token;
              const { body: createGalerieBody } = await agent
                .post('/galeries')
                .set('authorization', tokenTwo)
                .send({ name: 'galerie name' });
              const galerieTwoId = createGalerieBody.id;
              const { body, status } = await agent
                .delete(`/galeries/${galerieTwoId}/frames/${frameId}`)
                .set('authorization', token);
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: 'galerie not found',
              });
            });
            it('frame not found', async () => {
              const { body, status } = await agent
                .delete(`/galeries/${galerieId}/frames/100`)
                .set('authorization', token);
              expect(status).toEqual(404);
              expect(body).toStrictEqual({
                errors: 'frame not found',
              });
            });
            it('frame exist but not belong to the galerie', async () => {
              const { body: createGalerieBody } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const galerieTwoId = createGalerieBody.id;
              const { body, status } = await agent
                .delete(`/galeries/${galerieTwoId}/frames/${frameId}`)
                .set('authorization', token);
              expect(status).toEqual(404);
              expect(body).toStrictEqual({
                errors: 'frame not found',
              });
            });
          });
        });
      });
    });
  });
});
