import { Server } from 'http';
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
  let app: Server;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
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
  describe('name', () => {
    describe(':userName', () => {
      describe('GET', () => {
        describe('should return status 200 and', () => {
          it('not find himself', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(200);
            expect(body.length).toBe(0);
          });
          it('not find not confirmed users', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
            });
            await User.create({
              userName: 'user3',
              email: 'user3@email.com',
              password: 'password',
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(200);
            expect(body.length).toBe(0);
          });
          it('return 1 user', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(200);
            expect(body.length).toBe(1);
          });
          it('return 2 user', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            await User.create({
              userName: 'testusertest',
              email: 'user3@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(200);
            expect(body.length).toBe(2);
          });
          it('should be case insensitive', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            await User.create({
              userName: 'User2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(200);
            expect(body.length).toBe(1);
          });
          it('return relevent attributes', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const {
              id,
              userName,
              email,
            } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            const [findedUser] = body;
            expect(status).toBe(200);
            expect(findedUser.id).toBe(id);
            expect(findedUser.userName).toBe(userName);
            expect(findedUser.email).toBe(email);
            expect(findedUser.password).toBeUndefined();
            expect(findedUser.confirmed).toBeUndefined();
            expect(findedUser.authTokenVersion).toBeUndefined();
            expect(findedUser.confirmTokenVersion).toBeUndefined();
            expect(findedUser.emailTokenVersion).toBeUndefined();
            expect(findedUser.updatedEmailTokenVersion).toBeUndefined();
            expect(findedUser.resetPasswordTokenVersion).toBeUndefined();
            expect(findedUser.currentProfilePictureId).toBeUndefined();
          });
          it('include current profile pictures with relevent attributes, original/croped/pending image and signed urls', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            await User.create({
              userName: 'user3',
              email: 'user3@email.com',
              password: 'password',
              confirmed: true,
            });
            const tokenTwo = createAccessToken(userTwo);
            const {
              body: {
                id,
                originalImage: { id: originalImageId },
                cropedImage: { id: cropedImageId },
                pendingImage: { id: pendingImageId },
              },
            } = await request(app)
              .post('/users/me/ProfilePictures')
              .set('authorization', `Bearer ${tokenTwo}`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/user')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(200);
            expect(body.length).toBe(2);
            expect(body[0].currentProfilePicture).toBeNull();
            expect(body[1].currentProfilePicture.id).toBe(id);
            expect(body[1].currentProfilePicture.userId).toBeUndefined();
            expect(body[1].currentProfilePicture.originalImageId).toBeUndefined();
            expect(body[1].currentProfilePicture.cropedImageId).toBeUndefined();
            expect(body[1].currentProfilePicture.pendingImageId).toBeUndefined();
            expect(body[1].currentProfilePicture.createdAt).toBeUndefined();
            expect(body[1].currentProfilePicture.updatedAt).toBeUndefined();
            expect(body[1].currentProfilePicture.deletedAt).toBeUndefined();
            expect(body[1].currentProfilePicture.originalImage.id).toBe(originalImageId);
            expect(body[1].currentProfilePicture.cropedImage.id).toBe(cropedImageId);
            expect(body[1].currentProfilePicture.pendingImage.id).toBe(pendingImageId);
            expect(body[1].currentProfilePicture.originalImage.signedUrl).not.toBeNull();
            expect(body[1].currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
            expect(body[1].currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
          });
        });
        describe('should return status 401 if', () => {
          it('user not logged in', async () => {
            const { body, status } = await request(app)
              .get('/users/userName/azer');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_AUTHENTICATED,
            });
          });
          it('token is not \'Bearer ...\'', async () => {
            const { body, status } = await request(app)
              .get('/users/userName/azer')
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
            const { body, status } = await request(app)
              .get('/users/userName/azer')
              .set('authorization', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: WRONG_TOKEN_VERSION,
            });
          });
          it('user is not confirmed', async () => {
            const user = await User.create(newUser);
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .get('/users/userName/azer')
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
            const { body, status } = await request(app)
              .get('/users/userName/azer')
              .set('authorization', 'Bearer token');
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
