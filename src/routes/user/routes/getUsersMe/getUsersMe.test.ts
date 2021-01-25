import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const clearDatas = async () => {
  await User.sync({ force: true });
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
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
  userName: 'user',
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
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('get your own account with relevent properties', async () => {
          const { body, status } = await agent
            .get('/users/me')
            .set('authorization', token);
          expect(status).toBe(200);
          expect(body.defaultProfilePicture).toBeNull();
          expect(body.email).toBe(user.email);
          expect(body.id).toBe(user.id);
          expect(body.role).toBe(user.role);
          expect(body.userName).toBe(user.userName);
          expect(body.authTokenVersion).toBeUndefined();
          expect(body.blackListId).toBeUndefined();
          expect(body.confirmed).toBeUndefined();
          expect(body.confirmTokenVersion).toBeUndefined();
          expect(body.currentProfilePictureId).toBeUndefined();
          expect(body.emailTokenVersion).toBeUndefined();
          expect(body.googleId).toBeUndefined();
          expect(body.password).toBeUndefined();
          expect(body.resetPasswordTokenVersion).toBeUndefined();
          expect(body.updatedEmailTokenVersion).toBeUndefined();
        });
        let getResponse: request.Response;
        let postResponse: request.Response;
        beforeEach(async (done) => {
          try {
            postResponse = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            getResponse = await agent
              .get('/users/me')
              .set('authorization', token);
          } catch (err) {
            done(err);
          }
          done();
        });
        describe('include current profile picture', () => {
          it('with only relevent attributes', async () => {
            const {
              body: {
                cropedImage,
                id: currentProfilePictureId,
                originalImage,
                pendingImage,
              },
            } = postResponse;
            const { body: { currentProfilePicture }, status } = getResponse;
            expect(status).toBe(200);
            expect(currentProfilePicture.id).toBe(currentProfilePictureId);
            expect(currentProfilePicture.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImageId).toBeUndefined();
            expect(currentProfilePicture.deletedAt).toBeUndefined();
            expect(currentProfilePicture.originalImageId).toBeUndefined();
            expect(currentProfilePicture.pendingImageId).toBeUndefined();
            expect(currentProfilePicture.updatedAt).toBeUndefined();
            expect(currentProfilePicture.userId).toBeUndefined();
            expect(currentProfilePicture.cropedImage.id).toBe(cropedImage.id);
            expect(currentProfilePicture.cropedImage.bucketName).toBe(cropedImage.bucketName);
            expect(currentProfilePicture.cropedImage.fileName).toBe(cropedImage.fileName);
            expect(currentProfilePicture.cropedImage.format).toBe(cropedImage.format);
            expect(currentProfilePicture.cropedImage.height).toBe(cropedImage.height);
            expect(currentProfilePicture.cropedImage.size).toBe(cropedImage.size);
            expect(currentProfilePicture.cropedImage.width).toBe(cropedImage.width);
            expect(currentProfilePicture.cropedImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.deletedAt).toBeUndefined();
            expect(currentProfilePicture.cropedImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.id).toBe(originalImage.id);
            expect(currentProfilePicture.originalImage.bucketName).toBe(originalImage.bucketName);
            expect(currentProfilePicture.originalImage.fileName).toBe(originalImage.fileName);
            expect(currentProfilePicture.originalImage.format).toBe(originalImage.format);
            expect(currentProfilePicture.originalImage.height).toBe(originalImage.height);
            expect(currentProfilePicture.originalImage.size).toBe(originalImage.size);
            expect(currentProfilePicture.originalImage.width).toBe(originalImage.width);
            expect(currentProfilePicture.originalImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.deletedAt).toBeUndefined();
            expect(currentProfilePicture.originalImage.updatedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.id).toBe(pendingImage.id);
            expect(currentProfilePicture.pendingImage.bucketName).toBe(pendingImage.bucketName);
            expect(currentProfilePicture.pendingImage.fileName).toBe(pendingImage.fileName);
            expect(currentProfilePicture.pendingImage.format).toBe(pendingImage.format);
            expect(currentProfilePicture.pendingImage.height).toBe(pendingImage.height);
            expect(currentProfilePicture.pendingImage.size).toBe(pendingImage.size);
            expect(currentProfilePicture.pendingImage.width).toBe(pendingImage.width);
            expect(currentProfilePicture.pendingImage.createdAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.deletedAt).toBeUndefined();
            expect(currentProfilePicture.pendingImage.updatedAt).toBeUndefined();
          });
          it('with signed urls', async () => {
            const { body: { currentProfilePicture }, status } = getResponse;
            expect(status).toBe(200);
            expect(currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
            expect(currentProfilePicture.originalImage.signedUrl).not.toBeNull();
            expect(currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
          });
        });
        describe('include all profile pictures', () => {
          it('with only relevent attributes', async () => {
            const {
              body: {
                cropedImage,
                id: currentProfilePictureId,
                originalImage,
                pendingImage,
              },
            } = postResponse;
            const { body: { profilePictures }, status } = getResponse;
            const [returnProfilePicture] = profilePictures;
            expect(status).toBe(200);
            expect(profilePictures.length).toBe(1);
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
            const { body: { profilePictures }, status } = getResponse;
            const [returnProfilePicture] = profilePictures;
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
