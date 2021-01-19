import jwt from 'jsonwebtoken';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';

import '@src/helpers/initEnv';

import Image from '@src/db/models/image';
import User from '@src/db/models/user';
import ProfilePicture from '@src/db/models/profilePicture';
import accEnv from '@src/helpers/accEnv';
import { createAccessToken } from '@src/helpers/auth';
import {
  FILE_IS_REQUIRED,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');
const PORT = accEnv('PORT');

describe('users', () => {
  let socket: Socket;
  let sequelize: Sequelize;
  let server: Server;
  beforeAll((done) => {
    server = initApp().listen(PORT);
    socket = io(`http://127.0.0.1:${PORT}`);
    sequelize = initSequelize();
    done();
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
    } catch (err) {
      done(err);
    }
    socket.connect();
    done();
  });
  afterEach((done) => {
    jest.restoreAllMocks();
    if (socket.connected) socket.disconnect();
    done();
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
    } catch (err) {
      done(err);
    }
    socket.close();
    server.close();
    done();
  });
  describe('me', () => {
    describe('profilePicture', () => {
      describe('POST', () => {
        describe('should return status 200', () => {
          let token: String;
          let user: User;
          beforeEach(async () => {
            user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            token = createAccessToken(user);
          });
          it('should create a profile picture', async () => {
            const { status, body } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const profilePicture = await ProfilePicture.findAll({ where: { userId: user.id } });
            expect(status).toBe(200);
            expect(profilePicture.length).toBe(1);
            expect(body.id).toBe(user.id);
          });
          it('should store the original image', async () => {
            const { status, body } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const originalImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP,
              },
            });
            expect(status).toBe(200);
            expect(originalImages.length).toBe(1);
            expect(body.originalImageId).toBe(originalImages[0].id);
            expect(body.originalImage.id).toBe(originalImages[0].id);
          });
          it('should store the croped image', async () => {
            const { status, body } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const pendingImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP_PENDING,
              },
            });
            expect(status).toBe(200);
            expect(pendingImages.length).toBe(1);
            expect(pendingImages[0].width).toBe(1);
            expect(pendingImages[0].height).toBe(1);
            expect(body.pendingImageId).toBe(pendingImages[0].id);
            expect(body.pendingImage.id).toBe(pendingImages[0].id);
          });
          it('should store the pending image', async () => {
            const { status, body } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const cropedImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP_CROP,
              },
            });
            expect(status).toBe(200);
            expect(cropedImages.length).toBe(1);
            expect(cropedImages[0].width).toBe(200);
            expect(cropedImages[0].height).toBe(200);
            expect(body.cropedImageId).toBe(cropedImages[0].id);
            expect(body.cropedImage.id).toBe(cropedImages[0].id);
          });
          it('should set user\'s current profile picture', async () => {
            const { body } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const { currentProfilePictureId } = await user.reload();
            expect(currentProfilePictureId).toBe(body.id);
          });
          it('shouls emit the percentage progression', async () => {
            let finalPercentage = 0;
            socket.on('uploadImage', (percentage: number) => {
              expect(percentage).toBeGreaterThan(finalPercentage);
              expect(percentage).toBeLessThanOrEqual(1);
              finalPercentage = percentage;
            });
            await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(finalPercentage).toBe(1);
          });
        });
        describe('should return error 400 if', () => {
          it('image is not attached', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                image: FILE_IS_REQUIRED,
              },
            });
          });
          it('attached file\'s name is not \'image\'', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('file', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'something went wrong with attached file',
            });
          });
          it('multiple files are attached', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'something went wrong with attached file',
            });
          });
          it('attached file is not jpg/jpeg/png', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`)
              .attach('image', `${__dirname}/../../ressources/text.txt`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                image: 'uploaded file must be an image',
              },
            });
          });
        });
        describe('should return error 401 if', () => {
          it('user is not logged in', async () => {
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'not authenticated',
            });
          });
          it('auth token is not \'Bearer token\'', async () => {
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', 'token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'wrong token',
            });
          });
          it('user not confirmed', async () => {
            const user = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
            });
            const token = createAccessToken(user);
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'You\'re account need to be confimed',
            });
          });
        });
        describe('should return error 404 if', () => {
          it('user not found', async () => {
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id: 1,
              }));
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', 'Bearer token');
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: 'user not found',
            });
          });
        });
        describe('should return error 500 if', () => {
          it('auth token is wrong', async () => {
            const { body, status } = await request(initApp())
              .post('/users/me/ProfilePictures')
              .set('authorization', 'Bearer token');
            expect(status).toBe(500);
            expect(body.message).toBe('jwt malformed');
          });
        });
      });
    });
  });
});
