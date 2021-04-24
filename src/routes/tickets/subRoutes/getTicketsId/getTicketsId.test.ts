import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Image,
  ProfilePicture,
  Ticket,
  User,
} from '@src/db/models';

import accEnv from '@src/helpers/accEnv';
import initSequelize from '@src/helpers/initSequelize.js';
import gc from '@src/helpers/gc';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async (sequelize: Sequelize) => {
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
  await Ticket.sync({ force: true });
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

describe('tickets', () => {
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
      await cleanDatas(sequelize);
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        role: 'superAdmin',
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
  describe(':id', () => {
    describe('GET', () => {
      describe('should return status 200 and', () => {
        it('and return a ticket with only relevent attributes', async () => {
          const ticketHeader = 'header ticket';
          const bodyHeader = 'body ticket';
          await agent.post('/tickets')
            .set('authorization', token)
            .send({
              header: ticketHeader,
              body: bodyHeader,
            });
          const {
            body: {
              id: currentProfilePictureId,
              cropedImage: {
                id: cropedImageId,
                bucketName: cropedImageBucketName,
                fileName: cropedImageFileName,
                format: cropedImageFormat,
                height: cropedImageHeight,
                size: cropedImageSize,
                width: cropedImageWidth,
              },
              originalImage: {
                id: originalImageId,
                bucketName: originalImageBucketName,
                fileName: originalImageFileName,
                format: originalImageFormat,
                height: originalImageHeight,
                size: originalImageSize,
                width: originalImageWidth,
              },
              pendingImage: {
                id: pendingImageId,
                bucketName: pendingImageBucketName,
                fileName: pendingImageFileName,
                format: pendingImageFormat,
                height: pendingImageHeight,
                size: pendingImageSize,
                width: pendingImageWidth,
              },
            },
          } = await agent
            .post('/users/me/ProfilePictures')
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { id } = await Ticket.findOne({
            where: {
              userId: user.id,
            },
          }) as Ticket;
          const { status, body } = await agent
            .get(`/tickets/${id}`)
            .set('authorization', token);
          expect(status).toBe(200);
          expect(body.id).toBe(id);
          expect(body.header).toBe(ticketHeader);
          expect(body.body).toBe(bodyHeader);
          expect(body.createdAt).not.toBeNull();
          expect(body.updatedAt).toBe(undefined);
          expect(body.userId).toBe(undefined);
          expect(body.user.id).toBe(user.id);
          expect(body.user.defaultProfilePicture).toBe(null);
          expect(body.user.email).toBe(user.email);
          expect(body.user.role).toBe(user.role);
          expect(body.user.userName).toBe(user.userName);
          expect(body.user.authTokenVersion).toBe(undefined);
          expect(body.user.blackListId).toBe(undefined);
          expect(body.user.confirmed).toBe(undefined);
          expect(body.user.confirmTokenVersion).toBe(undefined);
          expect(body.user.currentProfilePictureId).toBe(undefined);
          expect(body.user.facebookId).toBe(undefined);
          expect(body.user.googleId).toBe(undefined);
          expect(body.user.password).toBe(undefined);
          expect(body.user.resetPasswordTokenVersion).toBe(undefined);
          expect(body.user.updatedEmailTokenVersion).toBe(undefined);
          expect(body.user.createdAt).toBe(undefined);
          expect(body.user.updatedAt).toBe(undefined);
          expect(body.user.deletedAt).toBe(undefined);
          expect(body.user.currentProfilePicture.id).toBe(currentProfilePictureId);
          expect(body.user.currentProfilePicture.cropedImageId).toBe(undefined);
          expect(body.user.currentProfilePicture.originalImageId).toBe(undefined);
          expect(body.user.currentProfilePicture.pendingImageId).toBe(undefined);
          expect(body.user.currentProfilePicture.userId).toBe(undefined);
          expect(body.user.currentProfilePicture.createdAt).toBe(undefined);
          expect(body.user.currentProfilePicture.deletedAt).toBe(undefined);
          expect(body.user.currentProfilePicture.updatedAt).toBe(undefined);
          expect(body.user.currentProfilePicture.cropedImage.id)
            .toBe(cropedImageId);
          expect(body.user.currentProfilePicture.cropedImage.bucketName)
            .toBe(cropedImageBucketName);
          expect(body.user.currentProfilePicture.cropedImage.fileName)
            .toBe(cropedImageFileName);
          expect(body.user.currentProfilePicture.cropedImage.format)
            .toBe(cropedImageFormat);
          expect(body.user.currentProfilePicture.cropedImage.height)
            .toBe(cropedImageHeight);
          expect(body.user.currentProfilePicture.cropedImage.size)
            .toBe(cropedImageSize);
          expect(body.user.currentProfilePicture.cropedImage.width)
            .toBe(cropedImageWidth);
          expect(body.user.currentProfilePicture.cropedImage.createdAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.cropedImage.updatedAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.cropedImage.deletedAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.cropedImage.signedUrl)
            .not.toBeNull();
          expect(body.user.currentProfilePicture.originalImage.id)
            .toBe(originalImageId);
          expect(body.user.currentProfilePicture.originalImage.bucketName)
            .toBe(originalImageBucketName);
          expect(body.user.currentProfilePicture.originalImage.fileName)
            .toBe(originalImageFileName);
          expect(body.user.currentProfilePicture.originalImage.format)
            .toBe(originalImageFormat);
          expect(body.user.currentProfilePicture.originalImage.height)
            .toBe(originalImageHeight);
          expect(body.user.currentProfilePicture.originalImage.size)
            .toBe(originalImageSize);
          expect(body.user.currentProfilePicture.originalImage.width)
            .toBe(originalImageWidth);
          expect(body.user.currentProfilePicture.originalImage.createdAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.originalImage.updatedAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.originalImage.deletedAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.originalImage.signedUrl)
            .not.toBeNull();
          expect(body.user.currentProfilePicture.pendingImage.id)
            .toBe(pendingImageId);
          expect(body.user.currentProfilePicture.pendingImage.bucketName)
            .toBe(pendingImageBucketName);
          expect(body.user.currentProfilePicture.pendingImage.fileName)
            .toBe(pendingImageFileName);
          expect(body.user.currentProfilePicture.pendingImage.format)
            .toBe(pendingImageFormat);
          expect(body.user.currentProfilePicture.pendingImage.height)
            .toBe(pendingImageHeight);
          expect(body.user.currentProfilePicture.pendingImage.size)
            .toBe(pendingImageSize);
          expect(body.user.currentProfilePicture.pendingImage.width)
            .toBe(pendingImageWidth);
          expect(body.user.currentProfilePicture.pendingImage.createdAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.pendingImage.updatedAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.pendingImage.deletedAt)
            .toBe(undefined);
          expect(body.user.currentProfilePicture.pendingImage.signedUrl)
            .not.toBeNull();
        });
        it('return ticket event if his user has deleted his account', async () => {
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            userName: 'user2',
            email: 'user2@email.com',
            confirmed: true,
            password: hashPassword,
          });
          const agentTwo = request.agent(app);
          const { body: { token: tokenTwo } } = await agentTwo
            .post('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: userTwo.userName,
            });
          await agentTwo.post('/tickets')
            .set('authorization', tokenTwo)
            .send({
              header: 'header ticket',
              body: 'body ticket',
            });
          const { id } = await Ticket.findOne({
            where: {
              userId: userTwo.id,
            },
          }) as Ticket;
          await agentTwo
            .delete('/users/me')
            .set('authorization', tokenTwo)
            .send({ password: newUser.password });
          const { status, body } = await agent
            .get(`/tickets/${id}`)
            .set('authorization', token);
          expect(status).toBe(200);
          expect(body.user).toBeNull();
        });
      });
      describe('should return status 404 if', () => {
        it('ticket not found', async () => {
          const { body, status } = await agent
            .get('/tickets/1')
            .set('authorization', token);
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: 'ticket not found',
          });
        });
      });
    });
  });
});
