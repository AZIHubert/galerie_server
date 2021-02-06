import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import { io, Socket } from 'socket.io-client';
import request from 'supertest';

import '@src/helpers/initEnv';

import { Image, ProfilePicture, User } from '@src/db/models';
import accEnv from '@src/helpers/accEnv';
import { FILE_IS_REQUIRED } from '@src/helpers/errorMessages';
import gc from '@src/helpers/gc';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');
const PORT = accEnv('PORT');

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
};

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
  const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
  await sequelize.model('Sessions').sync({ force: true });
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

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let socket: Socket;
  let sequelize: Sequelize;
  let user: User;
  let token: string;
  beforeAll((done) => {
    app = initApp().listen(PORT);
    socket = io(`http://127.0.0.1:${PORT}`);
    sequelize = initSequelize();
    done();
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
      await clearDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    socket.close();
    done();
  });
  describe('me', () => {
    describe('profilePicture', () => {
      describe('POST', () => {
        describe('should return status 200 and', () => {
          let response: request.Response;
          let profilePictures: ProfilePicture[];
          beforeEach(async (done) => {
            try {
              response = await agent
                .post('/users/me/ProfilePictures')
                .set('authorization', token)
                .attach('image', `${__dirname}/../../ressources/image.jpg`);
              profilePictures = await ProfilePicture.findAll({
                where: { userId: user.id },
              });
            } catch (err) {
              done(err);
            }
            done();
          });
          it('create a profile picture', async () => {
            const { status } = response;
            expect(status).toBe(200);
            expect(profilePictures.length).toBe(1);
          });
          it('store the original image', async () => {
            const { status } = response;
            const originalImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP,
              },
            });
            expect(status).toBe(200);
            expect(originalImages.length).toBe(1);
            expect(profilePictures[0].originalImageId).toBe(originalImages[0].id);
          });
          it('store the croped image', async () => {
            const { status } = response;
            const cropedImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP_CROP,
              },
            });
            expect(status).toBe(200);
            expect(cropedImages.length).toBe(1);
            expect(profilePictures[0].cropedImageId).toBe(cropedImages[0].id);
          });
          it('store the pending image', async () => {
            const { status } = response;
            const pendingImages = await Image.findAll({
              where: {
                bucketName: GALERIES_BUCKET_PP_PENDING,
              },
            });
            expect(status).toBe(200);
            expect(pendingImages.length).toBe(1);
            expect(profilePictures[0].pendingImageId).toBe(pendingImages[0].id);
          });
          it('set the user\'s current profile picture', async () => {
            const { body: { id } } = response;
            const { currentProfilePictureId } = await user.reload();
            expect(currentProfilePictureId).toBe(id);
          });
          describe('return this profile picture', () => {
            it('with only relevent attributes', async () => {
              const { body, status } = response;
              const cropedImage = await Image.findByPk(body.cropedImage.id);
              const originalImage = await Image.findByPk(body.originalImage.id);
              const pendingImage = await Image.findByPk(body.pendingImage.id);
              expect(status).toBe(200);
              expect(body.id).toBe(user.id);
              expect(body.createdAt).toBeUndefined();
              expect(body.cropedImageId).toBeUndefined();
              expect(body.deletedAt).toBeUndefined();
              expect(body.originalImageId).toBeUndefined();
              expect(body.pendingImageId).toBeUndefined();
              expect(body.updatedAt).toBeUndefined();
              expect(body.userId).toBeUndefined();
              expect(cropedImage).not.toBeNull();
              expect(body.cropedImage.bucketName).toBe(cropedImage!.bucketName);
              expect(body.cropedImage.fileName).toBe(cropedImage!.fileName);
              expect(body.cropedImage.format).toBe(cropedImage!.format);
              expect(body.cropedImage.height).toBe(cropedImage!.height);
              expect(body.cropedImage.size).toBe(cropedImage!.size);
              expect(body.cropedImage.width).toBe(cropedImage!.width);
              expect(body.cropedImage.createdAt).toBeUndefined();
              expect(body.cropedImage.deletedAt).toBeUndefined();
              expect(body.cropedImage.updatedAt).toBeUndefined();
              expect(body.originalImage.id).toBe(originalImage!.id);
              expect(body.originalImage.bucketName).toBe(originalImage!.bucketName);
              expect(body.originalImage.fileName).toBe(originalImage!.fileName);
              expect(body.originalImage.format).toBe(originalImage!.format);
              expect(body.originalImage.height).toBe(originalImage!.height);
              expect(body.originalImage.size).toBe(originalImage!.size);
              expect(body.originalImage.width).toBe(originalImage!.width);
              expect(body.originalImage.createdAt).toBeUndefined();
              expect(body.originalImage.deletedAt).toBeUndefined();
              expect(body.originalImage.updatedAt).toBeUndefined();
              expect(body.pendingImage.id).toBe(pendingImage!.id);
              expect(body.pendingImage.bucketName).toBe(pendingImage!.bucketName);
              expect(body.pendingImage.fileName).toBe(pendingImage!.fileName);
              expect(body.pendingImage.format).toBe(pendingImage!.format);
              expect(body.pendingImage.height).toBe(pendingImage!.height);
              expect(body.pendingImage.size).toBe(pendingImage!.size);
              expect(body.pendingImage.width).toBe(pendingImage!.width);
              expect(body.pendingImage.createdAt).toBeUndefined();
              expect(body.pendingImage.deletedAt).toBeUndefined();
              expect(body.pendingImage.updatedAt).toBeUndefined();
            });
            it('with signed urls', async () => {
              const {
                body: {
                  cropedImage,
                  originalImage,
                  pendingImage,
                }, status,
              } = response;
              expect(status).toBe(200);
              expect(cropedImage.signedUrl).not.toBeNull();
              expect(originalImage.signedUrl).not.toBeNull();
              expect(pendingImage.signedUrl).not.toBeNull();
            });
          });
          it('shouls emit the percentage progression', async (done) => {
            let finalPercentage = 0;
            socket.on('uploadImage', (percentage: number) => {
              expect(percentage).toBeGreaterThan(finalPercentage);
              expect(percentage).toBeLessThanOrEqual(1);
              finalPercentage = percentage;
            });
            await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(finalPercentage).toBe(1);
            if (finalPercentage === 1) done();
          });
        });
        describe('should return error 400 if', () => {
          it('image is not attached', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                image: FILE_IS_REQUIRED,
              },
            });
          });
          it('attached file\'s name is not \'image\'', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('file', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'something went wrong with attached file',
            });
          });
          it('multiple files are attached', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/image.jpg`)
              .attach('image', `${__dirname}/../../ressources/image.jpg`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'something went wrong with attached file',
            });
          });
          it('attached file is not jpg/jpeg/png', async () => {
            const { body, status } = await agent
              .post('/users/me/ProfilePictures')
              .set('authorization', token)
              .attach('image', `${__dirname}/../../ressources/text.txt`);
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                image: 'uploaded file must be an image',
              },
            });
          });
        });
      });
    });
  });
});
