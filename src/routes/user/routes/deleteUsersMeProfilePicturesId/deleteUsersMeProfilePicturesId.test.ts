import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import Image from '@src/db/models/image';
import ProfilePicture from '@src/db/models/profilePicture';
import User from '@src/db/models/user';
import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async () => {
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
};

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  let sequelize: Sequelize;
  let app: Server;
  let user: User;
  let agent: request.SuperAgentTest;
  let token: string;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
    agent = request.agent(app);
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await cleanDatas();
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      const { body } = await agent
        .get('/users/login')
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
      await cleanDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('me', () => {
    describe('profilePictures', () => {
      describe(':id', () => {
        describe('DELETE', () => {
          describe('should return status 200 and', () => {
            it('do not remove current PP if it isn\'t the current one', async () => {
              const { body: { id } } = await agent.post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const postResponse = await agent.post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              const { body: { id: currentId } } = postResponse;
              const { status } = await agent
                .delete(`/users/me/profilePictures/${id}`)
                .set('authorization', token);
              await user.reload();
              expect(status).toBe(200);
              expect(user.currentProfilePictureId).toBe(currentId);
              await agent
                .delete(`/users/me/profilePictures/${currentId}`)
                .set('authorization', token);
            });
            let deleteResponse: request.Response;
            let postResponse: request.Response;
            beforeEach(async (done) => {
              try {
                postResponse = await agent.post('/users/me/ProfilePictures')
                  .set('authorization', token)
                  .attach('image', `${__dirname}/../../ressources/image.jpg`);
                const { body: { id } } = postResponse;
                deleteResponse = await agent
                  .delete(`/users/me/profilePictures/${id}`)
                  .set('authorization', token);
              } catch (err) {
                done(err);
              }
              done();
            });
            it('delete original image', async () => {
              const { status } = deleteResponse;
              const { body: { originalImageId } } = postResponse;
              const originalImage = await Image.findByPk(originalImageId);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
              expect(status).toBe(200);
              expect(originalImage).toBe(null);
              expect(files.length).toBe(0);
            });
            it('delete croped image', async () => {
              const { status } = deleteResponse;
              const { body: { cropedImageId } } = postResponse;
              const cropedImage = await Image.findByPk(cropedImageId);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
              expect(status).toBe(200);
              expect(cropedImage).toBe(null);
              expect(files.length).toBe(0);
            });
            it('delete pending image', async () => {
              const { status } = deleteResponse;
              const { body: { pendingImageId } } = postResponse;
              const pendingImage = await Image.findByPk(pendingImageId);
              const [files] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
              expect(status).toBe(200);
              expect(pendingImage).toBe(null);
              expect(files.length).toBe(0);
            });
            it('delete profile picture', async () => {
              const { body: { id } } = postResponse;
              const { status } = deleteResponse;
              const profilePicture = await ProfilePicture.findByPk(id);
              expect(status).toBe(200);
              expect(profilePicture).toBe(null);
            });
            it('remove current PP if it\'s the current one', async () => {
              await user.reload();
              const { status } = deleteResponse;
              expect(status).toBe(200);
              expect(user.currentProfilePictureId).toBeNull();
            });
            it('return deleted id', async () => {
              const { body: { id } } = postResponse;
              const { body, status } = deleteResponse;
              expect(status).toBe(200);
              expect(body).toStrictEqual({ id });
            });
          });

          describe('should return status 404 if', () => {
            it('profile picture id not found', async () => {
              const { body, status } = await agent
                .delete('/users/me/profilePictures/1')
                .set('authorization', token);
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
