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
  describe('GET', () => {
    describe('should return status 200 and', () => {
      it('an empty array', async () => {
        const { status, body } = await agent
          .get('/tickets')
          .set('authorization', token);
        expect(status).toBe(200);
        expect(body.length).toBe(0);
      });
      it('an array with one ticket', async () => {
        await agent.post('/tickets')
          .set('authorization', token)
          .send({
            header: 'header ticket',
            body: 'body ticket',
          });
        const { status, body } = await agent
          .get('/tickets')
          .set('authorization', token);
        expect(status).toBe(200);
        expect(body.length).toBe(1);
      });
      it('an array with one ticket', async () => {
        await agent.post('/tickets')
          .set('authorization', token)
          .send({
            header: 'header ticket',
            body: 'body ticket',
          });
        await agent.post('/tickets')
          .set('authorization', token)
          .send({
            header: 'header ticket',
            body: 'body ticket',
          });
        const { status, body } = await agent
          .get('/tickets')
          .set('authorization', token);
        expect(status).toBe(200);
        expect(body.length).toBe(2);
      });
      it('with only relevent attributes', async () => {
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
          .get('/tickets')
          .set('authorization', token);
        expect(status).toBe(200);
        const [returnedTicket] = body;
        expect(returnedTicket.id).toBe(id);
        expect(returnedTicket.header).toBe(ticketHeader);
        expect(returnedTicket.body).toBe(bodyHeader);
        expect(returnedTicket.createdAt).not.toBeNull();
        expect(returnedTicket.updatedAt).toBe(undefined);
        expect(returnedTicket.userId).toBe(undefined);
        expect(returnedTicket.user.id).toBe(user.id);
        expect(returnedTicket.user.defaultProfilePicture).toBe(null);
        expect(returnedTicket.user.email).toBe(user.email);
        expect(returnedTicket.user.role).toBe(user.role);
        expect(returnedTicket.user.userName).toBe(user.userName);
        expect(returnedTicket.user.authTokenVersion).toBe(undefined);
        expect(returnedTicket.user.blackListId).toBe(undefined);
        expect(returnedTicket.user.confirmed).toBe(undefined);
        expect(returnedTicket.user.confirmTokenVersion).toBe(undefined);
        expect(returnedTicket.user.currentProfilePictureId).toBe(undefined);
        expect(returnedTicket.user.emailTokenVersion).toBe(undefined);
        expect(returnedTicket.user.facebookId).toBe(undefined);
        expect(returnedTicket.user.googleId).toBe(undefined);
        expect(returnedTicket.user.password).toBe(undefined);
        expect(returnedTicket.user.resetPasswordTokenVersion).toBe(undefined);
        expect(returnedTicket.user.updatedEmailTokenVersion).toBe(undefined);
        expect(returnedTicket.user.createdAt).toBe(undefined);
        expect(returnedTicket.user.updatedAt).toBe(undefined);
        expect(returnedTicket.user.deletedAt).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.id).toBe(currentProfilePictureId);
        expect(returnedTicket.user.currentProfilePicture.cropedImageId).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.originalImageId).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.pendingImageId).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.userId).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.createdAt).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.deletedAt).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.updatedAt).toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.id)
          .toBe(cropedImageId);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.bucketName)
          .toBe(cropedImageBucketName);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.fileName)
          .toBe(cropedImageFileName);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.format)
          .toBe(cropedImageFormat);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.height)
          .toBe(cropedImageHeight);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.size)
          .toBe(cropedImageSize);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.width)
          .toBe(cropedImageWidth);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.createdAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.updatedAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.deletedAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.cropedImage.signedUrl)
          .not.toBeNull();
        expect(returnedTicket.user.currentProfilePicture.originalImage.id)
          .toBe(originalImageId);
        expect(returnedTicket.user.currentProfilePicture.originalImage.bucketName)
          .toBe(originalImageBucketName);
        expect(returnedTicket.user.currentProfilePicture.originalImage.fileName)
          .toBe(originalImageFileName);
        expect(returnedTicket.user.currentProfilePicture.originalImage.format)
          .toBe(originalImageFormat);
        expect(returnedTicket.user.currentProfilePicture.originalImage.height)
          .toBe(originalImageHeight);
        expect(returnedTicket.user.currentProfilePicture.originalImage.size)
          .toBe(originalImageSize);
        expect(returnedTicket.user.currentProfilePicture.originalImage.width)
          .toBe(originalImageWidth);
        expect(returnedTicket.user.currentProfilePicture.originalImage.createdAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.originalImage.updatedAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.originalImage.deletedAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.originalImage.signedUrl)
          .not.toBeNull();
        expect(returnedTicket.user.currentProfilePicture.pendingImage.id)
          .toBe(pendingImageId);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.bucketName)
          .toBe(pendingImageBucketName);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.fileName)
          .toBe(pendingImageFileName);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.format)
          .toBe(pendingImageFormat);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.height)
          .toBe(pendingImageHeight);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.size)
          .toBe(pendingImageSize);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.width)
          .toBe(pendingImageWidth);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.createdAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.updatedAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.deletedAt)
          .toBe(undefined);
        expect(returnedTicket.user.currentProfilePicture.pendingImage.signedUrl)
          .not.toBeNull();
      });
      it('return tickets even if the user has deleted his account', async () => {
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
        await agentTwo
          .delete('/users/me')
          .set('authorization', tokenTwo)
          .send({ password: newUser.password });
        const { status, body } = await agent
          .get('/tickets')
          .set('authorization', token);
        const [returnedTicket] = body;
        expect(status).toBe(200);
        expect(body.length).toBe(1);
        expect(returnedTicket.user).toBeNull();
      });
    });
  });
});
