import request from 'supertest';

import '@src/helpers/initEnv';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import { createAccessToken } from '@src/helpers/auth';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const sequelize = initSequelize();

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const newUser = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  beforeEach(async (done) => {
    try {
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
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
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
    } catch (err) {
      done(err);
    }
    sequelize.close();
    done();
  });
  describe('me', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('should return own account with relevent properties', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.id).toBe(user.id);
          expect(body.userName).toBe(user.userName);
          expect(body.email).toBe(user.email);
          expect(body.role).toBe('user');
          expect(body.currentProfilePictureId).toBeUndefined();
          expect(body.password).toBeUndefined();
          expect(body.confirmed).toBeUndefined();
          expect(body.authTokenVersion).toBeUndefined();
          expect(body.confirmTokenVersion).toBeUndefined();
          expect(body.emailTokenVersion).toBeUndefined();
          expect(body.updatedEmailTokenVersion).toBeUndefined();
          expect(body.resetPasswordTokenVersion).toBeUndefined();
        });
        it('should include current profile picture', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          const { body: { id } } = await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.currentProfilePicture.id).toBe(id);
          expect(body.currentProfilePicture.userId).toBeUndefined();
          expect(body.currentProfilePicture.originalImageId).toBeUndefined();
          expect(body.currentProfilePicture.cropedImageId).toBeUndefined();
          expect(body.currentProfilePicture.pendingImageId).toBeUndefined();
          expect(body.currentProfilePicture.createdAt).toBeUndefined();
          expect(body.currentProfilePicture.updatedAt).toBeUndefined();
        });
        it('should include original/croped/pending currentPP', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          const {
            body: {
              originalImage: {
                id: originalImageId,
              },
              cropedImage: {
                id: cropedImageId,
              },
              pendingImage: {
                id: pendingImageId,
              },
            },
          } = await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.currentProfilePicture.originalImage.id).toBe(originalImageId);
          expect(body.currentProfilePicture.cropedImage.id).toBe(cropedImageId);
          expect(body.currentProfilePicture.pendingImage.id).toBe(pendingImageId);
        });
        it('include current PP signed url', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.currentProfilePicture.originalImage.signedUrl).not.toBeNull();
          expect(body.currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
          expect(body.currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
        });
        it('should include all PPs', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          const { body: { id } } = await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.profilePictures.length).toBe(2);
          expect(body.profilePictures[0].id).toBe(id);
          expect(body.profilePictures[0].userId).toBeUndefined();
          expect(body.profilePictures[0].originalImageId).toBeUndefined();
          expect(body.profilePictures[0].cropedImageId).toBeUndefined();
          expect(body.profilePictures[0].pendingImageId).toBeUndefined();
          expect(body.profilePictures[0].createdAt).toBeUndefined();
          expect(body.profilePictures[0].updatedAt).toBeUndefined();
        });
        it('should include original/croped/pending PPs', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          const {
            body: {
              originalImage: {
                id: originalImageIdOne,
              },
              cropedImage: {
                id: cropedImageIdOne,
              },
              pendingImage: {
                id: pendingImageIdOne,
              },
            },
          } = await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const {
            body: {
              originalImage: {
                id: originalImageIdTwo,
              },
              cropedImage: {
                id: cropedImageIdTwo,
              },
              pendingImage: {
                id: pendingImageIdTwo,
              },
            },
          } = await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.profilePictures[0].originalImage.id).toBe(originalImageIdOne);
          expect(body.profilePictures[0].cropedImage.id).toBe(cropedImageIdOne);
          expect(body.profilePictures[0].pendingImage.id).toBe(pendingImageIdOne);
          expect(body.profilePictures[1].originalImage.id).toBe(originalImageIdTwo);
          expect(body.profilePictures[1].cropedImage.id).toBe(cropedImageIdTwo);
          expect(body.profilePictures[1].pendingImage.id).toBe(pendingImageIdTwo);
        });
        it('return PPs signed url', async () => {
          const user = await User.create({ ...newUser, confirmed: true });
          const accessToken = createAccessToken(user);
          await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await request(initApp())
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessToken}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.profilePictures[0].originalImage.signedUrl).not.toBeNull();
          expect(body.profilePictures[0].cropedImage.signedUrl).not.toBeNull();
          expect(body.profilePictures[0].pendingImage.signedUrl).not.toBeNull();
          expect(body.profilePictures[1].originalImage.signedUrl).not.toBeNull();
          expect(body.profilePictures[1].cropedImage.signedUrl).not.toBeNull();
          expect(body.profilePictures[1].pendingImage.signedUrl).not.toBeNull();
        });
      });
      describe('should return 401 if not', () => {
        it('logged in', async () => {
          const { body, status } = await request(initApp())
            .get('/users/me');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_AUTHENTICATED,
          });
        });
        it('confirmed', async () => {
          const user = await User.create(newUser);
          const accessToken = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
      });
    });
  });
});
