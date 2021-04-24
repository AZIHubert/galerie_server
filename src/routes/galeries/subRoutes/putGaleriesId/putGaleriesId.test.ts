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

import {
  FIELD_NOT_A_STRING,
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
} from '@src/helpers/errorMessages';
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
  email: 'user@email.com',
  password: 'password',
  pseudonym: 'userName',
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
  const originalGalerieName = 'galerie name';
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
      const { body: { galerie } } = await agent
        .post('/galeries')
        .set('authorization', token)
        .send({ name: originalGalerieName });
      galerieId = galerie.id;
      const {
        body: {
          frame: {
            galeriePictures,
          },
        },
      } = await agent
        .post(`/galeries/${galerieId}/frames`)
        .set('authorization', token)
        .attach('images', `${__dirname}/../../ressources/image.jpg`)
        .attach('images', `${__dirname}/../../ressources/image.jpg`)
        .attach('images', `${__dirname}/../../ressources/image.jpg`);
      pictureId = galeriePictures[0].id;
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
    describe('PUT', () => {
      describe('it should return status 200', () => {
        it('and only update name', async () => {
          const name = 'new galerie name';
          await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({ name });
          const galerie = await Galerie.findByPk(galerieId);
          if (galerie) {
            expect(galerie.name).toEqual(name);
            expect(galerie.coverPictureId).toEqual(null);
          }
        });
        it('and only set coverPictureId to req.body.coverPictureId', async () => {
          await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({ coverPictureId: pictureId });
          const galerie = await Galerie.findByPk(galerieId);
          if (galerie) {
            expect(galerie.name).toEqual(originalGalerieName);
            expect(galerie.coverPictureId).toEqual(pictureId);
          }
        });
        it('and only set coverPictureId to null', async () => {
          await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({ coverPictureId: pictureId });
          await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({ coverPictureId: pictureId });
          const galerie = await Galerie.findByPk(galerieId);
          if (galerie) {
            expect(galerie.coverPictureId).toBeNull();
          }
        });
        it('and update both name and coverPictureId', async () => {
          const name = 'new galerie name';
          await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({
              coverPictureId: pictureId,
              name,
            });
          const galerie = await Galerie.findByPk(galerieId);
          if (galerie) {
            expect(galerie.coverPictureId).toEqual(pictureId);
            expect(galerie.name).toEqual(name);
          }
        });
      });
      describe('it should return error 400 if', () => {
        it('user role is user', async () => {
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
            .put(`/galeries/${galerieId}`)
            .set('authorization', tokenTwo)
            .set({ name: 'new galerie name' });
          expect(status).toEqual(400);
          expect(body).toStrictEqual({
            errors: 'not allow to update this galerie',
          });
        });
        it('req.body is an empty object', async () => {
          const { body, status } = await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token);
          expect(status).toEqual(400);
          expect(body).toStrictEqual({
            errors: 'no changes commited',
          });
        });
        it('req.body.coverPicture exist and is not in the galerie.frame.galeriePicture', async () => {
          const { body, status } = await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({ coverPictureId: '100' });
          expect(status).toEqual(400);
          expect(body).toStrictEqual({
            errors: "picture id doen't exist",
          });
        });
        describe('req.body.name exist and', () => {
          it('name is not a string', async () => {
            const { body, status } = await agent
              .put(`/galeries/${galerieId}`)
              .set('authorization', token)
              .send({ name: 1234 });
            expect(status).toEqual(400);
            expect(body).toStrictEqual({
              errors: { name: FIELD_NOT_A_STRING },
            });
          });
          it('name is less than 3 characters', async () => {
            const { body, status } = await agent
              .put(`/galeries/${galerieId}`)
              .set('authorization', token)
              .send({ name: 'a'.repeat(2) });
            expect(status).toEqual(400);
            expect(body).toStrictEqual({
              errors: { name: FIELD_MIN_LENGTH_OF_THREE },
            });
          });
          it('name is more than 30 characters', async () => {
            const { body, status } = await agent
              .put(`/galeries/${galerieId}`)
              .set('authorization', token)
              .send({ name: 'a'.repeat(31) });
            expect(status).toEqual(400);
            expect(body).toStrictEqual({
              errors: { name: FIELD_MAX_LENGTH_THRITY },
            });
          });
          it('name is an empty string', async () => {
            const { body, status } = await agent
              .put(`/galeries/${galerieId}`)
              .set('authorization', token)
              .send({ name: '' });
            expect(status).toEqual(400);
            expect(body).toStrictEqual({
              errors: { name: FIELD_IS_EMPTY },
            });
          });
        });
      });
      describe('it should return error 404 if', () => {
        it('galerie not found', async () => {
          const { body, status } = await agent
            .put('/galeries/100')
            .set('authorization', token)
            .set({ name: 'new galerie name' });
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
          const {
            body: {
              galerie: {
                id,
              },
            },
          } = await agent
            .post('/galeries')
            .set('authorization', tokenTwo)
            .send({ name: 'galerie name' });
          const { body, status } = await agent
            .put(`/galeries/${id}`)
            .set('authorization', token)
            .send({ name: 'new galerie name' });
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: 'galerie not found',
          });
        });
      });
    });
  });
});
