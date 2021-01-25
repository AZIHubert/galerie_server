import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { Image, ProfilePicture, User } from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const clearDatas = async () => {
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
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  let token: string;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas();
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      const { body } = await agent
        .get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
      token = body.token;
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await clearDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('me', () => {
    describe('profilePictures', () => {
      describe(':id', () => {
        describe('PUT', () => {
          describe('should return status 200 and', () => {
            it('update current profile picture if params.id is not the same than the current one', async () => {
              const {
                body: {
                  cropedImage,
                  id,
                  originalImage,
                  pendingImage,
                },
              } = await agent
                .post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              await agent
                .post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body, status } = await agent
                .put(`/users/me/profilePictures/${id}`)
                .set('authorization', token);
              expect(status).toBe(200);
              expect(body.id).toBe(id);
              expect(body.createdAt).toBeUndefined();
              expect(body.cropedImageId).toBeUndefined();
              expect(body.deletedAt).toBeUndefined();
              expect(body.originalImageId).toBeUndefined();
              expect(body.pendingImageId).toBeUndefined();
              expect(body.updatedAt).toBeUndefined();
              expect(body.userId).toBeUndefined();
              expect(body.cropedImage.id).toBe(cropedImage.id);
              expect(body.cropedImage.bucketName).toBe(cropedImage.bucketName);
              expect(body.cropedImage.fileName).toBe(cropedImage.fileName);
              expect(body.cropedImage.format).toBe(cropedImage.format);
              expect(body.cropedImage.height).toBe(cropedImage.height);
              expect(body.cropedImage.size).toBe(cropedImage.size);
              expect(body.cropedImage.width).toBe(cropedImage.width);
              expect(body.cropedImage.createdAt).toBeUndefined();
              expect(body.cropedImage.deletedAt).toBeUndefined();
              expect(body.cropedImage.updatedAt).toBeUndefined();
              expect(body.originalImage.id).toBe(originalImage.id);
              expect(body.originalImage.bucketName).toBe(originalImage.bucketName);
              expect(body.originalImage.fileName).toBe(originalImage.fileName);
              expect(body.originalImage.format).toBe(originalImage.format);
              expect(body.originalImage.height).toBe(originalImage.height);
              expect(body.originalImage.size).toBe(originalImage.size);
              expect(body.originalImage.width).toBe(originalImage.width);
              expect(body.originalImage.createdAt).toBeUndefined();
              expect(body.originalImage.deletedAt).toBeUndefined();
              expect(body.originalImage.updatedAt).toBeUndefined();
              expect(body.pendingImage.id).toBe(pendingImage.id);
              expect(body.pendingImage.bucketName).toBe(pendingImage.bucketName);
              expect(body.pendingImage.fileName).toBe(pendingImage.fileName);
              expect(body.pendingImage.format).toBe(pendingImage.format);
              expect(body.pendingImage.height).toBe(pendingImage.height);
              expect(body.pendingImage.size).toBe(pendingImage.size);
              expect(body.pendingImage.width).toBe(pendingImage.width);
              expect(body.pendingImage.createdAt).toBeUndefined();
              expect(body.pendingImage.deletedAt).toBeUndefined();
              expect(body.pendingImage.updatedAt).toBeUndefined();
            });
            it('return signed urls if changed', async () => {
              const { body: { id } } = await agent
                .post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              await agent
                .post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body, status } = await agent
                .put(`/users/me/profilePictures/${id}`)
                .set('authorization', token);
              expect(status).toBe(200);
              expect(body.originalImage.signedUrl).not.toBeNull();
              expect(body.cropedImage.signedUrl).not.toBeNull();
              expect(body.pendingImage.signedUrl).not.toBeNull();
            });
            it('delete current profile picture if params.id is the same than the current one', async () => {
              const { body: { id } } = await agent
                .post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              await user.update({ currentProfilePictureId: id });
              const { status } = await agent
                .put(`/users/me/profilePictures/${id}`)
                .set('authorization', token);
              await user.reload();
              expect(status).toBe(200);
              expect(user.currentProfilePictureId).toBeNull();
            });
          });
          describe('should return status 404 if', () => {
            it('profile picture id not found', async () => {
              const { body, status } = await agent
                .put('/users/me/profilePictures/1')
                .set('authorization', token);
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: 'profile picture not found',
              });
            });
          });
        });
      });
    });
  });
});
