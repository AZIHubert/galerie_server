import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import BlackList from '@src/db/models/blackList';
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

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

describe('users', () => {
  let sequelize: Sequelize;
  let app: Server;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    try {
      await BlackList.sync({ force: true });
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
      await BlackList.sync({ force: true });
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
      await sequelize.close();
      app.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('GET', () => {
    describe('should return status 200 and', () => {
      it('get all users exept current', async () => {
        await User.create({
          userName: 'user2',
          email: 'user2@email.com',
          password: 'password',
          confirmed: true,
        });
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(body.length).toBe(1);
        expect(status).toBe(200);
      });
      it('get all users expect not confirmed', async () => {
        await User.create({
          userName: 'user2',
          email: 'user2@email.com',
          password: 'password',
          confirmed: true,
        });
        await User.create({
          userName: 'user3',
          email: 'user3@email.com',
          password: 'password',
          confirmed: false,
        });
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(body.length).toBe(1);
        expect(status).toBe(200);
      });
      it('get all users expect black listed', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
          role: 'admin',
        });
        const { id: blackListId } = await BlackList.create({
          adminId: user.id,
          reason: 'black list user',
        });
        await User.create({
          userName: 'user2',
          email: 'user2@email.com',
          password: 'password',
          confirmed: true,
          blackListId,
        });
        await User.create({
          userName: 'user3',
          email: 'user3@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(body.length).toBe(1);
        expect(status).toBe(200);
      });
      it('get all current users', async () => {
        await User.create({
          userName: 'user2',
          email: 'user2@email.com',
          password: 'password',
          confirmed: true,
        });
        await User.create({
          userName: 'user3',
          email: 'user3@email.com',
          password: 'password',
          confirmed: false,
        });
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(body.length).toBe(1);
        expect(status).toBe(200);
      });
      it('include only relevent attributes', async () => {
        const searchedUser = await User.create({
          userName: 'user2',
          email: 'user2@email.com',
          password: 'password',
          confirmed: true,
        });
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(status).toBe(200);
        const [returnedUser] = body;
        expect(returnedUser.id).toBe(searchedUser.id);
        expect(returnedUser.userName).toBe(searchedUser.userName);
        expect(returnedUser.role).toBe('user');
        expect(returnedUser.blackListId).toBeUndefined();
        expect(returnedUser.email).toBeUndefined();
        expect(returnedUser.password).toBeUndefined();
        expect(returnedUser.confirmed).toBeUndefined();
        expect(returnedUser.authTokenVersion).toBeUndefined();
        expect(returnedUser.confirmTokenVersion).toBeUndefined();
        expect(returnedUser.emailTokenVersion).toBeUndefined();
        expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
        expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
        expect(returnedUser.currentProfilePictureId).toBeUndefined();
      });
      it('should include current profile picture', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
        });
        await User.create({
          userName: 'user2',
          email: 'user2@email.com',
          password: 'password',
          confirmed: true,
        });
        const searchedUserTwo = await User.create({
          userName: 'user3',
          email: 'user3@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessTokenUserTwo = createAccessToken(searchedUserTwo);
        const {
          body: {
            id,
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
        } = await request(app)
          .post('/users/me/ProfilePictures')
          .set('authorization', `Bearer ${accessTokenUserTwo}`)
          .attach('image', `${__dirname}/../../ressources/image.jpg`);
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        const [returnedUserOne, returnedUserTwo] = body;
        expect(status).toBe(200);
        expect(returnedUserOne.currentProfilePicture).toBeNull();
        expect(returnedUserTwo.currentProfilePicture.id).toBe(id);
        expect(returnedUserTwo.currentProfilePicture.originalImage.id).toBe(originalImageId);
        expect(returnedUserTwo.currentProfilePicture.cropedImage.id).toBe(cropedImageId);
        expect(returnedUserTwo.currentProfilePicture.pendingImage.id).toBe(pendingImageId);
      });
      it('return signed url', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'password',
          confirmed: true,
        });
        const searchedUser = await User.create({
          userName: 'user3',
          email: 'user3@email.com',
          password: 'password',
          confirmed: true,
        });
        const accessTokenUserTwo = createAccessToken(searchedUser);
        await request(app)
          .post('/users/me/ProfilePictures')
          .set('authorization', `Bearer ${accessTokenUserTwo}`)
          .attach('image', `${__dirname}/../../ressources/image.jpg`);
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        const [returnedUser] = body;
        expect(status).toBe(200);
        expect(returnedUser.currentProfilePicture.originalImage.signedUrl).not.toBeNull();
        expect(returnedUser.currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
        expect(returnedUser.currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
      });
    });
    describe('Should return error 401 if', () => {
      it('not authenticated', async () => {
        const { body, status } = await request(app)
          .get('/users');
        expect(status).toBe(401);
        expect(body).toStrictEqual({
          errors: NOT_AUTHENTICATED,
        });
      });
      it('not confirmed', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          confirmed: false,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(app)
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(status).toBe(401);
        expect(body).toStrictEqual({
          errors: NOT_CONFIRMED,
        });
      });
    });
  });
});
