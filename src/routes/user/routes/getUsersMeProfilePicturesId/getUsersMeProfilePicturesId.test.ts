import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import { createAccessToken } from '@src/helpers/auth';
import User from '@src/db/models/user';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  let sequelize: Sequelize;
  beforeAll(() => {
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    try {
      await Image.sync({ force: true });
      await ProfilePicture.sync({ force: true });
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await Image.sync({ force: true });
      await ProfilePicture.sync({ force: true });
      await User.sync({ force: true });
      await sequelize.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('me', () => {
    describe('profilePictures', () => {
      describe(':id', () => {
        describe('GET', () => {
          describe('should return status 200 and', () => {
            it('return profile picture', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const { id: imageId } = await Image.create({
                bucketName: 'bucketName',
                fileName: 'fileName',
                format: 'format',
                height: 100,
                size: 1000,
                width: 100,
              });
              const { id } = await ProfilePicture.create({
                userId: user.id,
                originalImageId: imageId,
                cropedImageId: imageId,
                pendingImageId: imageId,
              });
              const token = createAccessToken(user);
              const { body, status } = await request(initApp())
                .get(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(200);
              expect(body.id).toBe(id);
              expect(body.userId).toBe(user.id);
            });
            it('populate profile picture', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const { id: imageId } = await Image.create({
                bucketName: 'bucketName',
                fileName: 'fileName',
                format: 'format',
                height: 100,
                size: 1000,
                width: 100,
              });
              const { id } = await ProfilePicture.create({
                userId: user.id,
                originalImageId: imageId,
                cropedImageId: imageId,
                pendingImageId: imageId,
              });
              const token = createAccessToken(user);
              const { body, status } = await request(initApp())
                .get(`/users/me/profilePictures/${id}`)
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(200);
              expect(body.originalImage.id).toBe(imageId);
              expect(body.cropedImage.id).toBe(imageId);
              expect(body.pendingImage.id).toBe(imageId);
            });
          });
          describe('should return status 401 if', () => {
            it('user not logged in', async () => {
              const { body, status } = await request(initApp())
                .get('/users/me/profilePictures/1');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_AUTHENTICATED,
              });
            });
            it('token is not \'Bearer ...\'', async () => {
              const { body, status } = await request(initApp())
                .get('/users/me/profilePictures/1')
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
                .get('/users/me/profilePictures/1')
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
                .get('/users/me/profilePictures/1')
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
                .get('/users/me/profilePictures/1')
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
                .get('/users/me/profilePictures/1')
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
