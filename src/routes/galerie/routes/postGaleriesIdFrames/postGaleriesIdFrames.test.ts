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
import {
  FILES_ARE_REQUIRED,
  FILE_IS_IMAGE,
} from '@src/helpers/errorMessages';

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
        describe('should return status 200', () => {
          it('and create a frame width 1 images', async () => {
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toEqual(200);
            expect(body.galerieId).toEqual(galerieId);
            expect(body.galeriePictures.length).toEqual(1);
            expect(body.galeriePictures[0].cropedImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[0].pendingImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[0].originalImage.signedUrl).not.toBeUndefined();
          });
          it('and create a frame width 3 images', async () => {
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toEqual(200);
            expect(body.galerieId).toEqual(galerieId);
            expect(body.galeriePictures.length).toEqual(3);
            expect(body.galeriePictures[0].cropedImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[0].pendingImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[0].originalImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[1].cropedImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[1].pendingImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[1].originalImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[2].cropedImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[2].pendingImage.signedUrl).not.toBeUndefined();
            expect(body.galeriePictures[2].originalImage.signedUrl).not.toBeUndefined();
          });
          it('and create a frame width 6 images', async () => {
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toEqual(200);
            expect(body.galerieId).toEqual(galerieId);
            expect(body.galeriePictures.length).toEqual(6);
          });
        });
        describe('should return error 400 if', () => {
          it('no images are sent', async () => {
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token);
            expect(status).toBe(400);
            expect(body).toEqual({
              errors: FILES_ARE_REQUIRED,
            });
          });
          it('more than 6 image have been sent', async () => {
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toEqual(400);
            expect(body).toStrictEqual({
              errors: 'too much files have been sent',
            });
          });
          //
          it('one of the files is not an image', async () => {
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/text.txt`);
            expect(status).toEqual(400);
            expect(body).toEqual({
              errors: FILE_IS_IMAGE,
            });
            const { body: bodyTwo, status: statusTwo } = await agent
              .post(`/galeries/${galerieId}/frames`)
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/text.txt`);
            expect(statusTwo).toEqual(400);
            expect(bodyTwo).toEqual({
              errors: FILE_IS_IMAGE,
            });
          });
        });
        describe('should return error 404 if', () => {
          it('galerie not found', async () => {
            const { body, status } = await agent
              .post('/galeries/100/frames')
              .set('authorization', token);
            expect(status).toEqual(404);
            expect(body).toStrictEqual({
              errors: 'galerie not found',
            });
          });
          it('user not subscribe to requested galerie', async () => {
            const hashPassword = await hash(newUser.password, saltRounds);
            const userTwo = await User.create({
              ...newUser,
              email: 'use2r@email.com',
              userName: '@userName2',
              confirmed: true,
              password: hashPassword,
            });
            const { body: bodyToken } = await agent
              .post('/users/login')
              .send({
                password: newUser.password,
                userNameOrEmail: userTwo.email,
              });
            const tokenTwo = bodyToken.token;
            const { body: { id } } = await agent
              .post('/galeries')
              .set('authorization', tokenTwo)
              .send({ name: 'galerie name' });
            const { body, status } = await agent
              .post(`/galeries/${id}/frames`)
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
