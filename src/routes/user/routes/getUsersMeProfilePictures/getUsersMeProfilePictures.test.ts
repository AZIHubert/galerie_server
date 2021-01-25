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
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
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
      describe('GET', () => {
        describe('should return status 200 and', () => {
          it('get an empty array', async () => {
            const { body, status } = await agent
              .get('/users/me/profilePictures')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(0);
          });
          describe('get all profile picture', () => {
            let getResponse: request.Response;
            let postResponse: request.Response;
            beforeEach(async (done) => {
              try {
                postResponse = await agent
                  .post('/users/me/ProfilePictures')
                  .set('authorization', token)
                  .attach('image', `${__dirname}/../../ressources/image.jpg`);
                getResponse = await agent
                  .get('/users/me/profilePictures')
                  .set('authorization', token);
              } catch (err) {
                done(err);
              }
              done();
            });
            it('with only relevent attributes', async () => {
              const {
                body: {
                  cropedImage,
                  id: currentProfilePictureId,
                  originalImage,
                  pendingImage,
                },
              } = postResponse;
              const { body, status } = getResponse;
              const [returnProfilePicture] = body;
              expect(status).toBe(200);
              expect(body.length).toBe(1);
              expect(returnProfilePicture.id).toBe(currentProfilePictureId);
              expect(returnProfilePicture.createdAt).toBeUndefined();
              expect(returnProfilePicture.cropedImageId).toBeUndefined();
              expect(returnProfilePicture.deletedAt).toBeUndefined();
              expect(returnProfilePicture.originalImageId).toBeUndefined();
              expect(returnProfilePicture.pendingImageId).toBeUndefined();
              expect(returnProfilePicture.updatedAt).toBeUndefined();
              expect(returnProfilePicture.userId).toBeUndefined();
              expect(returnProfilePicture.cropedImage.id).toBe(cropedImage.id);
              expect(returnProfilePicture.cropedImage.bucketName).toBe(cropedImage.bucketName);
              expect(returnProfilePicture.cropedImage.fileName).toBe(cropedImage.fileName);
              expect(returnProfilePicture.cropedImage.format).toBe(cropedImage.format);
              expect(returnProfilePicture.cropedImage.height).toBe(cropedImage.height);
              expect(returnProfilePicture.cropedImage.size).toBe(cropedImage.size);
              expect(returnProfilePicture.cropedImage.width).toBe(cropedImage.width);
              expect(returnProfilePicture.cropedImage.createdAt).toBeUndefined();
              expect(returnProfilePicture.cropedImage.deletedAt).toBeUndefined();
              expect(returnProfilePicture.cropedImage.updatedAt).toBeUndefined();
              expect(returnProfilePicture.originalImage.id).toBe(originalImage.id);
              expect(returnProfilePicture.originalImage.bucketName).toBe(originalImage.bucketName);
              expect(returnProfilePicture.originalImage.fileName).toBe(originalImage.fileName);
              expect(returnProfilePicture.originalImage.format).toBe(originalImage.format);
              expect(returnProfilePicture.originalImage.height).toBe(originalImage.height);
              expect(returnProfilePicture.originalImage.size).toBe(originalImage.size);
              expect(returnProfilePicture.originalImage.width).toBe(originalImage.width);
              expect(returnProfilePicture.originalImage.createdAt).toBeUndefined();
              expect(returnProfilePicture.originalImage.deletedAt).toBeUndefined();
              expect(returnProfilePicture.originalImage.updatedAt).toBeUndefined();
              expect(returnProfilePicture.pendingImage.id).toBe(pendingImage.id);
              expect(returnProfilePicture.pendingImage.bucketName).toBe(pendingImage.bucketName);
              expect(returnProfilePicture.pendingImage.fileName).toBe(pendingImage.fileName);
              expect(returnProfilePicture.pendingImage.format).toBe(pendingImage.format);
              expect(returnProfilePicture.pendingImage.height).toBe(pendingImage.height);
              expect(returnProfilePicture.pendingImage.size).toBe(pendingImage.size);
              expect(returnProfilePicture.pendingImage.width).toBe(pendingImage.width);
              expect(returnProfilePicture.pendingImage.createdAt).toBeUndefined();
              expect(returnProfilePicture.pendingImage.deletedAt).toBeUndefined();
              expect(returnProfilePicture.pendingImage.updatedAt).toBeUndefined();
            });
            it('with signed urls', async () => {
              const { body, status } = getResponse;
              const [returnProfilePicture] = body;
              expect(status).toBe(200);
              expect(returnProfilePicture.originalImage.signedUrl).not.toBeNull();
              expect(returnProfilePicture.cropedImage.signedUrl).not.toBeNull();
              expect(returnProfilePicture.pendingImage.signedUrl).not.toBeNull();
            });
          });
        });
      });
    });
  });
});
