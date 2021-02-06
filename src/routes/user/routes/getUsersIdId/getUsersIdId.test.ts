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
import {
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async (sequelize: Sequelize) => {
  await BlackList.sync({ force: true });
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
  const [cropedImages] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
  await Promise.all(cropedImages
    .map(async (image) => {
      await image.delete();
    }));
  const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
  await Promise.all(originalImages
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
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await cleanDatas(sequelize);
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
      await cleanDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('id', () => {
    describe(':id', () => {
      describe('GET', () => {
        describe('shouls return status 200 and', () => {
          it('get user :id with only relevent attributes', async () => {
            const hashPassword = await hash(newUser.password, saltRounds);
            const { id, role, userName } = await User.create({
              confirmed: true,
              email: 'user3@email.com',
              password: hashPassword,
              userName: 'user3',
            });
            const { body, status } = await agent
              .get(`/users/id/${id}`)
              .set('authorization', token);
            expect(status).toBe(200);
            expect(typeof body.createdAt).toBe('string');
            expect(body.defaultProfilePicture).toBeNull();
            expect(body.id).toBe(id);
            expect(body.role).toBe(role);
            expect(typeof body.updatedAt).toBe('string');
            expect(body.userName).toBe(userName);
            expect(body.authTokenVersion).toBeUndefined();
            expect(body.blackListId).toBeUndefined();
            expect(body.confirmed).toBeUndefined();
            expect(body.confirmTokenVersion).toBeUndefined();
            expect(body.currentProfilePictureId).toBeUndefined();
            expect(body.email).toBeUndefined();
            expect(body.emailTokenVersion).toBeUndefined();
            expect(body.googleId).toBeUndefined();
            expect(body.password).toBeUndefined();
            expect(body.resetPasswordTokenVersion).toBeUndefined();
            expect(body.updatedEmailTokenVersion).toBeUndefined();
          });
          describe('include current profile picture', () => {
            let getResponse: request.Response;
            let postResponse: request.Response;
            let userTwo: User;
            beforeEach(async (done) => {
              try {
                const hashPassword = await hash(newUser.password, saltRounds);
                userTwo = await User.create({
                  confirmed: true,
                  email: 'user2@email.com',
                  password: hashPassword,
                  userName: 'user2',
                });
                const agentTwo = request.agent(app);
                const { body: { token: tokenTwo } } = await agentTwo
                  .post('/users/login')
                  .send({
                    password: newUser.password,
                    userNameOrEmail: userTwo.userName,
                  });
                postResponse = await agentTwo
                  .post('/users/me/ProfilePictures')
                  .set('authorization', tokenTwo)
                  .attach('image', `${__dirname}/../../ressources/image.jpg`);
                getResponse = await agent
                  .get(`/users/id/${userTwo.id}`)
                  .set('authorization', token);
              } catch (err) {
                done(err);
              }
              done();
            });
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
        });
        describe('should return status 400 if', () => {
          it('params.id is the same than the current one', async () => {
            const { body, status } = await agent
              .get(`/users/id/${user.id}`)
              .set('authorization', token);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'params.id is the same as your current one',
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user params.id not found', async () => {
            const { body, status } = await agent
              .get('/users/id/1000')
              .set('authorization', token);
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
            const { body, status } = await agent
              .get(`/users/id/${id}`)
              .set('authorization', token);
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user params.id is black listed', async () => {
            const { id: blackListId } = await BlackList.create({
              adminId: user.id,
              reason: 'black list user',
            });
            const { id } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              blackListId,
            });
            const { body, status } = await agent
              .get(`/users/id/${id}`)
              .set('authorization', token);
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
