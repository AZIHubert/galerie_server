import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import BlackList from '@src/db/models/blackList';
import { createAccessToken } from '@src/helpers/auth';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  NOT_SUPER_ADMIN,
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
  let app: Server;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
    try {
      await BlackList.sync({ force: true });
      await User.sync({ force: true });
      done();
    } catch (err) {
      done(err);
    }
  });
  afterAll(async (done) => {
    try {
      await BlackList.sync({ force: true });
      await User.sync({ force: true });
      await sequelize.close();
      app.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('blackList', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('return all black listed user with relevent attributes', async () => {
          const user = await User.create({
            ...newUser,
            confirmed: true,
            role: 'admin',
          });
          const { id: blackListIdOne } = await BlackList.create({
            adminId: user.id,
            reason: 'black list user two',
          });
          const { id: blackListIdTwo } = await BlackList.create({
            adminId: user.id,
            reason: 'black list user two',
          });
          const { id, email, userName } = await User.create({
            userName: 'user2',
            email: 'user2@email.com',
            password: 'password',
            confirmed: true,
            blackListId: blackListIdOne,
          });
          await User.create({
            userName: 'user3',
            email: 'user3@email.com',
            password: 'password',
            confirmed: true,
            blackListId: blackListIdTwo,
          });
          await User.create({
            userName: 'user4',
            email: 'user4@email.com',
            password: 'password',
            confirmed: true,
          });
          const token = createAccessToken(user);
          const { body, status } = await request(app)
            .get('/users/blackList/')
            .set('authorization', `Bearer ${token}`);
          expect(status).toBe(200);
          expect(body.length).toBe(2);
          expect(body[0].id).toBe(id);
          expect(body[0].userName).toBe(userName);
          expect(body[0].email).toBe(email);
          expect(body[0].role).toBeUndefined();
          expect(body[0].blackListId).toBeUndefined();
          expect(body[0].password).toBeUndefined();
          expect(body[0].confirmed).toBeUndefined();
          expect(body[0].authTokenVersion).toBeUndefined();
          expect(body[0].confirmTokenVersion).toBeUndefined();
          expect(body[0].emailTokenVersion).toBeUndefined();
          expect(body[0].updatedEmailTokenVersion).toBeUndefined();
          expect(body[0].resetPasswordTokenVersion).toBeUndefined();
          expect(body[0].currentProfilePictureId).toBeUndefined();
        });
        it('include black list', async () => {
          const reason = 'black list user two';
          const user = await User.create({
            ...newUser,
            confirmed: true,
            role: 'admin',
          });
          const { id: blackListId } = await BlackList.create({
            adminId: user.id,
            reason,
          });
          await User.create({
            userName: 'user2',
            email: 'user2@email.com',
            password: 'password',
            confirmed: true,
            blackListId,
          });
          const token = createAccessToken(user);
          const { body, status } = await request(app)
            .get('/users/blackList/')
            .set('authorization', `Bearer ${token}`);
          const [{ blackList }] = body;
          expect(status).toBe(200);
          expect(blackList.id).toBe(blackListId);
          expect(blackList.time).toBe(null);
          expect(blackList.reason).toBe(reason);
          expect(blackList.userId).toBeUndefined();
          expect(blackList.deletedAt).toBeNull();
          expect(blackList.admin.id).toBe(user.id);
          expect(blackList.admin.password).toBeUndefined();
          expect(blackList.admin.confirmed).toBeUndefined();
          expect(blackList.admin.authTokenVersion).toBeUndefined();
          expect(blackList.admin.confirmTokenVersion).toBeUndefined();
          expect(blackList.admin.emailTokenVersion).toBeUndefined();
          expect(blackList.admin.updatedEmailTokenVersion).toBeUndefined();
          expect(blackList.admin.resetPasswordTokenVersion).toBeUndefined();
          expect(blackList.admin.currentProfilePictureId).toBeUndefined();
          expect(blackList.admin.blackListId).toBeUndefined();
          expect(blackList.admin.email).toBeUndefined();
        });
        it('include current profile picture', async () => {
          const user = await User.create({
            ...newUser,
            confirmed: true,
            role: 'admin',
          });
          const { id: blackListId } = await BlackList.create({
            adminId: user.id,
            reason: 'black list user two',
          });
          const userTwo = await User.create({
            userName: 'user2',
            email: 'user2@email.com',
            password: 'password',
            confirmed: true,
          });
          const accessTokenUserTwo = createAccessToken(userTwo);
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
          await userTwo.update({ blackListId });
          const token = createAccessToken(user);
          const { body, status } = await request(app)
            .get('/users/blackList/')
            .set('authorization', `Bearer ${token}`);
          const [returnedUser] = body;
          expect(status).toBe(200);
          expect(returnedUser.currentProfilePicture.id).toBe(id);
          expect(returnedUser.currentProfilePicture.originalImage.id).toBe(originalImageId);
          expect(returnedUser.currentProfilePicture.cropedImage.id).toBe(cropedImageId);
          expect(returnedUser.currentProfilePicture.pendingImage.id).toBe(pendingImageId);
        });
        it('return signed url', async () => {
          const user = await User.create({
            ...newUser,
            confirmed: true,
            role: 'admin',
          });
          const { id: blackListId } = await BlackList.create({
            adminId: user.id,
            reason: 'black list user two',
          });
          const userTwo = await User.create({
            userName: 'user2',
            email: 'user2@email.com',
            password: 'password',
            confirmed: true,
          });
          const accessTokenUserTwo = createAccessToken(userTwo);
          await request(app)
            .post('/users/me/ProfilePictures')
            .set('authorization', `Bearer ${accessTokenUserTwo}`)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await userTwo.update({ blackListId });
          const token = createAccessToken(user);
          const { body, status } = await request(app)
            .get('/users/blackList/')
            .set('authorization', `Bearer ${token}`);
          const [returnedUser] = body;
          expect(status).toBe(200);
          expect(returnedUser.currentProfilePicture.originalImage.signedUrl).not.toBeNull();
          expect(returnedUser.currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
          expect(returnedUser.currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
        });
      });
      describe('should return status 401 if', () => {
        it('user not logged in', async () => {
          const { body, status } = await request(app)
            .get('/users/blackList/');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_AUTHENTICATED,
          });
        });
        it('token is not \'Bearer ...\'', async () => {
          const { body, status } = await request(app)
            .get('/users/blackList/')
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
            .get('/users/blackList/')
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
            .get('/users/blackList/')
            .set('authorization', `Bearer ${token}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
        it('user role is user', async () => {
          const user = await User.create({
            ...newUser,
            confirmed: true,
          });
          const token = createAccessToken(user);
          const { body, status } = await request(app)
            .get('/users/blackList/')
            .set('authorization', `Bearer ${token}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_SUPER_ADMIN,
          });
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id: 1, authTokenVersion: 0 }));
          const { body, status } = await request(app)
            .get('/users/blackList/')
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
