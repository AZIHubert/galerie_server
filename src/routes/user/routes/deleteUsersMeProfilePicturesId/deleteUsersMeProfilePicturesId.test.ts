import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
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
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

describe('users', () => {
  let sequelize: Sequelize;
  beforeAll(() => {
    sequelize = initSequelize();
  });
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
      done();
    } catch (err) {
      done(err);
    }
  });
  afterAll(async (done) => {
    try {
      await User.sync({ force: true });
      await Image.sync({ force: true });
      await ProfilePicture.sync({ force: true });
      const [files] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
      await Promise.all(files
        .map(async (file) => {
          await file.delete();
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
      await sequelize.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('me', () => {
    describe('profilePictures', () => {
      describe(':id', () => {
        describe('DELETE', () => {
          describe('should return status 200 and', () => {
            it('delete original image', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id, originalImageId } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              const originalImage = await Image.findByPk(originalImageId);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
              expect(status).toBe(200);
              expect(originalImage).toBe(null);
              expect(files.length).toBe(0);
            });
            it('delete croped image', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id, cropedImageId } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              const cropedImage = await Image.findByPk(cropedImageId);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
              expect(status).toBe(200);
              expect(cropedImage).toBe(null);
              expect(files.length).toBe(0);
            });
            it('delete pending image', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id, pendingImageId } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              const pendingImage = await Image.findByPk(pendingImageId);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
              expect(status).toBe(200);
              expect(pendingImage).toBe(null);
              expect(files.length).toBe(0);
            });
            it('delete profile picture', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              const profilePicture = await ProfilePicture.findByPk(id);
              expect(status).toBe(200);
              expect(profilePicture).toBe(null);
            });
            it('remove current PP if it\'s the current one', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              await user.reload();
              expect(user.currentProfilePictureId).toBe(id);
              const { status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              await user.reload();
              expect(status).toBe(200);
              expect(user.currentProfilePictureId).toBeNull();
            });
            it('do not remove current PP if it isn\'t the current one', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body: { id: currentId } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              await user.reload();
              expect(status).toBe(200);
              expect(user.currentProfilePictureId).toBe(currentId);
            });
            it('return deleted id', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body: { id } } = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${token}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body, status } = await request(initApp())
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(200);
              expect(body).toStrictEqual({ id });
            });
          });
          describe('should return status 401 if', () => {
            it('user not logged in', async () => {
              const { body, status } = await request(initApp())
                .delete('/users/me/profilePictures/1');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_AUTHENTICATED,
              });
            });
            it('token is not \'Bearer ...\'', async () => {
              const { body, status } = await request(initApp())
                .delete('/users/me/profilePictures/1')
                .set('authorization', 'token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN,
              });
            });
            it('authTokenVersions not match', async () => {
              const { id } = await User.create(newUser);
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id, authTokenVersion: 1 }));
              const { body, status } = await request(initApp())
                .delete('/users/me/profilePictures/1')
                .set('authorization', 'Bearer token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN_VERSION,
              });
            });
            it('user is not confirmed', async () => {
              const user = await User.create(newUser);
              const token = createAccessToken(user);
              const { body, status } = await request(initApp())
                .delete('/users/me/profilePictures/1')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_CONFIRMED,
              });
            });
          });
          describe('should return status 404 if', () => {
            it('user not found', async () => {
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id: 1, authTokenVersion: 0 }));
              const { body, status } = await request(initApp())
                .delete('/users/me/profilePictures/1')
                .set('authorization', 'Bearer token');
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
            it('profile picture id not found', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body, status } = await request(initApp())
                .delete('/users/me/profilePictures/1')
                .set('authorization', `Bearer ${token}`);
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
