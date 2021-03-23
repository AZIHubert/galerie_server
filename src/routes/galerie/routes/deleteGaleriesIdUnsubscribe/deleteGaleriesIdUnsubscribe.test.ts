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
    describe('unsubscribe', () => {
      describe('should return status 200', () => {
        it('and destroy GalerieUser model', async () => {
          const { body: { id: galerieId } } = await agent
            .post('/galeries')
            .set('authorization', token)
            .send({ name: 'galerie name' });
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            ...newUser,
            confirmed: true,
            email: 'user2@email.com',
            password: hashPassword,
            userName: 'user2',
          });
          await GalerieUser.create({
            userId: userTwo.id,
            galerieId,
            role: 'admin',
          });
          const { body: { token: tokenTwo } } = await agent
            .post('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: userTwo.email,
            });
          const { body, status } = await agent
            .delete(`/galeries/${galerieId}/unsubscribe`)
            .set('authorization', tokenTwo);
          expect(status).toEqual(200);
          expect(body).toStrictEqual({
            id: galerieId,
          });
          const galerieUser = await GalerieUser.findOne({
            where: {
              galerieId,
              userId: userTwo.id,
            },
          });
          expect(galerieUser).toBeNull();
        });
        it('and delete galerie if they\'re no user left', async () => {
          const { body: { id: galerieId } } = await agent
            .post('/galeries')
            .set('authorization', token)
            .send({ name: 'galerie name' });
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            ...newUser,
            confirmed: true,
            email: 'user2@email.com',
            password: hashPassword,
            userName: 'user2',
          });
          await GalerieUser.create({
            userId: userTwo.id,
            galerieId,
            role: 'admin',
          });
          await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const { body: { token: tokenTwo } } = await agent
            .post('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: userTwo.email,
            });
          await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await agent
            .delete(`/galeries/${galerieId}/unsubscribe`)
            .set('authorization', tokenTwo);
          const galerie = await Galerie.findByPk(galerieId);
          const frames = await Frame.findAll({
            where: {
              galerieId,
            },
          });
          const galeriePictures = await GaleriePicture.findAll();
          const images = await Image.findAll();
          expect(status).toEqual(200);
          expect(body).toStrictEqual({
            id: galerieId,
          });
          expect(galerie).toBeNull();
          expect(frames.length).toBeFalsy();
          expect(galeriePictures.length).toBeFalsy();
          expect(images.length).toBeFalsy();
        });
      });
      describe('should return error 400 if', () => {
        it('current user is the creator of this galerie', async () => {
          const { body: { id: galerieId } } = await agent
            .post('/galeries')
            .set('authorization', token)
            .send({ name: 'galerie name' });
          const { body, status } = await agent
            .delete(`/galeries/${galerieId}/unsubscribe`)
            .set('authorization', token);
          expect(status).toEqual(400);
          expect(body).toStrictEqual({
            errors: 'you cannot unsubscribe a galerie you\'ve created',
          });
        });
      });
      describe('should return error 404 if', () => {
        it('galerie not found', async () => {
          const { body, status } = await agent
            .delete('/galeries/100/unsubscribe')
            .set('authorization', token);
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: 'galerie not found',
          });
        });
      });
    });
  });
});
