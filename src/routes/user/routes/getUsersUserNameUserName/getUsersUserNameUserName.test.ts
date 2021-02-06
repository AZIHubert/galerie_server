import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  BlackList,
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

const clearDatas = async (sequelize: Sequelize) => {
  await BlackList.sync({ force: true });
  await User.sync({ force: true });
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
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
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas(sequelize);
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      const { body } = await agent
        .post('/users/login')
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
      await clearDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('name', () => {
    describe(':userName', () => {
      describe('GET', () => {
        describe('should return status 200 and', () => {
          it('not find himself', async () => {
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(0);
          });
          it('not find not confirmed users', async () => {
            await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
            });
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(0);
          });
          it('not find black listed users', async () => {
            const { id: blackListId } = await BlackList.create({
              adminId: user.id,
              reason: 'black list user',
            });
            await User.create({
              blackListId,
              confirmed: true,
              email: 'user2@email.com',
              password: 'password',
              userName: 'user2',
            });
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(0);
          });
          it('get 1 user', async () => {
            await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(1);
          });
          it('get 2 users', async () => {
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
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(2);
          });
          it('should be case insensitive', async () => {
            await User.create({
              userName: 'User2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            expect(status).toBe(200);
            expect(body.length).toBe(1);
          });
          it('return relevent attributes', async () => {
            const {
              id,
              role,
              userName,
            } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
            });
            const { body, status } = await agent
              .get('/users/userName/user')
              .set('authorization', token);
            const [returnedUser] = body;
            expect(status).toBe(200);
            expect(body.length).toBe(1);
            expect(typeof returnedUser.createdAt).toBe('string');
            expect(returnedUser.defaultProfilePicture).toBeNull();
            expect(returnedUser.id).toBe(id);
            expect(returnedUser.role).toBe(role);
            expect(typeof returnedUser.updatedAt).toBe('string');
            expect(returnedUser.userName).toBe(userName);
            expect(returnedUser.authTokenVersion).toBeUndefined();
            expect(returnedUser.blackListId).toBeUndefined();
            expect(returnedUser.confirmed).toBeUndefined();
            expect(returnedUser.confirmTokenVersion).toBeUndefined();
            expect(returnedUser.currentProfilePictureId).toBeUndefined();
            expect(returnedUser.email).toBeUndefined();
            expect(returnedUser.emailTokenVersion).toBeUndefined();
            expect(returnedUser.googleId).toBeUndefined();
            expect(returnedUser.password).toBeUndefined();
            expect(returnedUser.resetPasswordTokenVersion).toBeUndefined();
            expect(returnedUser.updatedEmailTokenVersion).toBeUndefined();
          });
          describe('include current profile picture', () => {
            it('with only relevent attributes', async () => {
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                confirmed: true,
                email: 'user3@email.com',
                password: hashPassword,
                userName: 'user3',
              });
              const agentTwo = request.agent(app);
              const { body: { token: tokenTwo } } = await agentTwo
                .post('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.userName,
                });
              const {
                body: {
                  cropedImage,
                  id,
                  originalImage,
                  pendingImage,
                },
              } = await agentTwo
                .post('/users/me/ProfilePictures')
                .set('authorization', tokenTwo)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body: [{ currentProfilePicture }], status } = await agent
                .get(`/users/userName/${userTwo.userName}`)
                .set('authorization', token);
              expect(status).toBe(200);
              expect(currentProfilePicture.id).toBe(id);
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
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                confirmed: true,
                email: 'user3@email.com',
                password: hashPassword,
                userName: 'user3',
              });
              const agentTwo = request.agent(app);
              const { body: { token: tokenTwo } } = await agentTwo.post('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.userName,
                });
              await agentTwo.post('/users/me/ProfilePictures')
                .set('authorization', tokenTwo)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body: [{ currentProfilePicture }], status } = await agent
                .get(`/users/userName/${userTwo.userName}`)
                .set('authorization', token);
              expect(status).toBe(200);
              expect(currentProfilePicture.cropedImage.signedUrl).not.toBeNull();
              expect(currentProfilePicture.originalImage.signedUrl).not.toBeNull();
              expect(currentProfilePicture.pendingImage.signedUrl).not.toBeNull();
            });
          });
        });
      });
    });
  });
});
