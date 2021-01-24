import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { Image, ProfilePicture, User } from '@src/db/models';
import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async () => {
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
  await User.sync({ force: true });
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
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  let sequelize: Sequelize;
  let app: Server;
  let user: User;
  let agent: request.SuperAgentTest;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
    agent = request.agent(app);
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await cleanDatas();
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      await agent
        .get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      // await cleanDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('me', () => {
    describe('DELETE', () => {
      describe('should return status 204 and', () => {
        it('delete user', async () => {
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const users = await User.findAll();
          expect(status).toBe(204);
          expect(users.length).toBe(0);
        });
        it('delete all profile pictures', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const profilePictures = await ProfilePicture.findAll();
          expect(status).toBe(204);
          expect(profilePictures.length).toBe(0);
        });
        it('delete all profile picture\'s original images', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const originalImage = await Image.findAll({
            where: {
              bucketName: GALERIES_BUCKET_PP,
            },
          });
          expect(status).toBe(204);
          expect(originalImage.length).toBe(0);
        });
        it('delete all profile picture\'s original image\'s files', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
          expect(status).toBe(204);
          expect(originalImages.length).toBe(0);
        });
        it('delete all profile picture\'s croped images', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const cropedImages = await Image.findAll({
            where: {
              bucketName: GALERIES_BUCKET_PP_CROP,
            },
          });
          expect(status).toBe(204);
          expect(cropedImages.length).toBe(0);
        });
        it('delete all profile picture\'s croped image\'s files', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const [cropedImages] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
          expect(status).toBe(204);
          expect(cropedImages.length).toBe(0);
        });
        it('delete all profile picture\'s pending images', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const pendingImages = await Image.findAll({
            where: {
              bucketName: GALERIES_BUCKET_PP_PENDING,
            },
          });
          expect(status).toBe(204);
          expect(pendingImages.length).toBe(0);
        });
        it('delete all profile picture\'s pending image\'s files', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const [pendingImages] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
          expect(status).toBe(204);
          expect(pendingImages.length).toBe(0);
        });
        it('don\'t delete other profile pictures', async () => {
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            confirmed: true,
            email: 'user2@email.com',
            password: hashPassword,
            userName: 'user2',
          });
          const agentTwo = request.agent(app);
          await agentTwo
            .get('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: userTwo.userName,
            });
          await agentTwo.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          const profilePictures = await ProfilePicture.findAll();
          const images = await Image.findAll();
          const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
          const [cropedImages] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
          const [pendingImages] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
          expect(status).toBe(204);
          expect(profilePictures.length).toBe(1);
          expect(images.length).toBe(3);
          expect(originalImages.length).toBe(1);
          expect(cropedImages.length).toBe(1);
          expect(pendingImages.length).toBe(1);
        });
        it('logout', async () => {
          const { status } = await agent
            .delete('/users/me/')
            .send({ password: newUser.password });
          expect(status).toBe(204);
        });
      });
      describe('should return status 400', () => {
        it('password not send', async () => {
          const { body, status } = await agent
            .delete('/users/me/');
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_REQUIRED,
            },
          });
        });
        it('password dosen\'t match', async () => {
          const { body, status } = await agent
            .delete('/users/me/')
            .send({ password: 'wrongPassword' });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: WRONG_PASSWORD,
            },
          });
        });
      });
    });
  });
});
