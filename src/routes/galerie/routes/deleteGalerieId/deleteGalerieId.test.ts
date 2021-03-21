import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Frame,
  Galerie,
  GalerieUser,
  GaleriePicture,
  Image,
  User,
  Like,
  Invitation,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import accEnv from '@src/helpers/accEnv';
import initApp from '@src/server';
import gc from '@src/helpers/gc';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async (sequelize: Sequelize) => {
  await Frame.sync({ force: true });
  await Galerie.sync({ force: true });
  await GaleriePicture.sync({ force: true });
  await GalerieUser.sync({ force: true });
  await Image.sync({ force: true });
  await Like.sync({ force: true });
  await Invitation.sync({ force: true });
  await User.sync({ force: true });
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
  pseudonym: 'userName',
  email: 'user@email.com',
  password: 'password',
  userName: '@userName',
};

describe('galeries', () => {
  let sequelize: Sequelize;
  let app: Server;
  let user: User;
  let agent: request.SuperAgentTest;
  let token: string;
  let galerieId: string;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
    agent = request.agent(app);
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
          userNameOrEmail: user.email,
        });
      token = body.token;
      const { body: createGalerieBody } = await agent
        .post('/galeries')
        .set('authorization', token)
        .send({ name: 'galerie name' });
      galerieId = createGalerieBody.id;
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
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
        it('delete all images from Google Storage', async () => {
          await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const [filesCrop] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
          expect(filesCrop.length).toBe(0);
          const [filesOriginal] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
          expect(filesOriginal.length).toBe(0);
          const [filesPending] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
          expect(filesPending.length).toBe(0);
        });
        it('should delete all images', async () => {
          await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const images = await Image.findAll();
          expect(images.length).toEqual(0);
        });
        it('should delete all galeriePictures', async () => {
          await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const galeriePictures = await GaleriePicture.findAll();
          expect(galeriePictures.length).toEqual(0);
        });
        it('should delete all frames', async () => {
          await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const frames = await Frame.findAll();
          expect(frames.length).toEqual(0);
        });
        it('should delete all likes', async () => {
          const { body: { id: frameId } } = await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          await agent
            .put(`/galeries/${galerieId}/frames/${frameId}`)
            .set('authorization', token);
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const likes = await Like.findAll();
          expect(likes.length).toEqual(0);
        });
        it('should delete even if galerie has a coverPicture', async () => {
          const { body: { galeriePictures } } = await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const pictureId = galeriePictures[0].id;
          await agent
            .put(`/galeries/${galerieId}`)
            .set('authorization', token)
            .send({ coverPictureId: pictureId });
          const { body, status } = await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          expect(status).toEqual(200);
          expect(body).toStrictEqual({
            id: galerieId,
          });
        });
        it('should delete all invitations', async () => {
          await agent
            .post(`/galeries/${galerieId}/invitations`)
            .set('authorization', token)
            .send({});
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const invitations = await Invitation.findAll();
          expect(invitations.length).toEqual(0);
        });
        it('should delete all galerieUser', async () => {
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            ...newUser,
            userName: 'user2',
            email: 'user2@email.com',
            confirmed: true,
            password: hashPassword,
          });
          await GalerieUser.create({
            userId: userTwo.id,
            galerieId,
            role: 'user',
          });
          await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', token);
          const galerieUsers = await GalerieUser.findAll();
          expect(galerieUsers.length).toEqual(0);
        });
      });
      describe('should return error 400 if', () => {
        it('user\'s role is not creator', async () => {
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            ...newUser,
            userName: 'user2',
            email: 'user2@email.com',
            confirmed: true,
            password: hashPassword,
          });
          await GalerieUser.create({
            userId: userTwo.id,
            galerieId,
            role: 'user',
          });
          const { body: { token: tokenTwo } } = await agent
            .post('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: userTwo.email,
            });
          const { body, status } = await agent
            .delete(`/galeries/${galerieId}`)
            .set('authorization', tokenTwo);
          expect(status).toEqual(400);
          expect(body).toStrictEqual({
            errors: 'not allow to delete this galerie',
          });
        });
      });
      describe('should return error 404 if', () => {
        it('galerie doesn\'t exist', async () => {
          const { body, status } = await agent
            .delete('/galeries/100/')
            .set('authorization', token);
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: 'galerie not found',
          });
        });
      });
    });
  });
});
