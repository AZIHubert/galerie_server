import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import Image from '@src/db/models/image';
import User from '@src/db/models/user';
import ProfilePicture from '@src/db/models/profilePicture';
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

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  let sequelize: Sequelize;
  let app: Server;
  beforeAll(() => {
    app = initApp();
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
      app.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('id', () => {
    describe(':id', () => {
      describe('GET', () => {
        describe('shouls return status 200 and', () => {
          let postPPResponse: request.Response;
          let findedUser: User;
          let response: request.Response;
          beforeEach(async (done) => {
            try {
              findedUser = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
              });
              const findedUserToken = createAccessToken(findedUser);
              postPPResponse = await request(initApp())
                .post('/users/me/ProfilePictures')
                .set('authorization', `Bearer ${findedUserToken}`)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { id } = findedUser;
              response = await request(initApp())
                .get(`/users/id/${id}`)
                .set('authorization', `Bearer ${token}`);
              done();
            } catch (err) {
              done(err);
            }
          });
          it('return finded user with current PP included', async () => {
            const {
              body: {
                id: currentProfilePictureId,
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
            } = postPPResponse;

            const { id } = findedUser;
            const { body, status } = response;
            expect(status).toBe(200);
            expect(body.id).toBe(id);
            expect(body.userName).toBe(findedUser.userName);
            expect(body.email).toBeUndefined();
            expect(body.role).toBe('user');
            expect(body.password).toBeUndefined();
            expect(body.confirmed).toBeUndefined();
            expect(body.authTokenVersion).toBeUndefined();
            expect(body.confirmTokenVersion).toBeUndefined();
            expect(body.emailTokenVersion).toBeUndefined();
            expect(body.updatedEmailTokenVersion).toBeUndefined();
            expect(body.resetPasswordTokenVersion).toBeUndefined();
            expect(body.currentProfilePicture.id).toBe(currentProfilePictureId);
            expect(body.currentProfilePicture.originalImage.id).toBe(originalImageId);
            expect(body.currentProfilePicture.cropedImage.id).toBe(cropedImageId);
            expect(body.currentProfilePicture.pendingImage.id).toBe(pendingImageId);
          });
          it('each images should have a signedUrl', async () => {
            const { body, status } = response;
            expect(status).toBe(200);
            expect(body.currentProfilePicture.originalImage.signedUrl).not.toBeNull();
            expect(body.currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
            expect(body.currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
          });
        });
        describe('should return status 400 if', () => {
          it('params.id is the same than the current one', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .get(`/users/id/${user.id}`)
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'params.id is the same as your current one',
            });
          });
        });
        describe('should return status 401 if', () => {
          it('user not logged in', async () => {
            const { body, status } = await request(initApp())
              .get('/users/id/1');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_AUTHENTICATED,
            });
          });
          it('token is not \'Bearer ...\'', async () => {
            const { body, status } = await request(initApp())
              .get('/users/id/1')
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
              .get('/users/id/1')
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
              .get('/users/id/1')
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
              .get('/users/id/1')
              .set('authorization', 'Bearer token');
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user params.id not found', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .get('/users/id/1000')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user params.id is not confirmed', async () => {
            const { id } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
            });
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .get(`/users/id/${id}`)
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
        });
      });
    });
  });
});
