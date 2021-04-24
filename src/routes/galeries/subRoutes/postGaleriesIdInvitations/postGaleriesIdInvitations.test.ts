import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  FIELD_NOT_A_NUMBER,
} from '@src/helpers/errorMessages';
import {
  Frame,
  Galerie,
  GalerieUser,
  GaleriePicture,
  Image,
  Invitation,
  User,
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
    describe('invitations', () => {
      describe('POST', () => {
        describe('Should return status 200', () => {
          it('and create an invit with time/numOfInvit === null', async () => {
            const { body: { id: galerieId } } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/invitations`)
              .set('authorization', token)
              .send({});
            expect(status).toEqual(200);
            expect(body.galerieId).toEqual(galerieId);
            expect(body.numOfInvit).toEqual(null);
            expect(body.time).toEqual(null);
            expect(body.user.id).toEqual(user.id);
          });
          it('with time === null', async () => {
            const numOfInvit = 1;
            const { body: { id: galerieId } } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/invitations`)
              .set('authorization', token)
              .send({ numOfInvit });
            expect(status).toEqual(200);
            expect(body.numOfInvit).toEqual(numOfInvit);
            expect(body.time).toEqual(null);
          });
          it('with numOfTime === null', async () => {
            const time = 1000 * 60 * 5;
            const { body: { id: galerieId } } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/invitations`)
              .set('authorization', token)
              .send({ time });
            expect(status).toEqual(200);
            expect(body.numOfInvit).toEqual(null);
            expect(body.time).toEqual(time);
          });
          it('with time/numOfTime !== null', async () => {
            const numOfInvit = 1;
            const time = 1000 * 60 * 5;
            const { body: { id: galerieId } } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
            const { body, status } = await agent
              .post(`/galeries/${galerieId}/invitations`)
              .set('authorization', token)
              .send({ time, numOfInvit });
            expect(status).toEqual(200);
            expect(body.numOfInvit).toEqual(numOfInvit);
            expect(body.time).toEqual(time);
          });
        });
        describe('Should return status 400', () => {
          it('if user\'s role is "user"', async () => {
            const { body: { id: galerieId } } = await agent
              .post('/galeries')
              .set('authorization', token)
              .send({ name: 'galerie name' });
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
              .post(`/galeries/${galerieId}/invitations`)
              .set('authorization', tokenTwo);
            expect(status).toEqual(400);
            expect(body).toStrictEqual({
              errors: 'not allow to create an invit',
            });
          });
          describe('if time', () => {
            it('is not a number', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .post(`/galeries/${galerieId}/invitations`)
                .set('authorization', token)
                .send({ time: 'string' });
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: {
                  time: FIELD_NOT_A_NUMBER,
                },
              });
            });
            it('is less than 5 mn (1000 * 60 * 5)', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .post(`/galeries/${galerieId}/invitations`)
                .set('authorization', token)
                .send({ time: 100 * 60 * 4 });
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: {
                  time: 'should be at least 5mn',
                },
              });
            });
            it('is more than 1 year (1000 * 60 * 60 * 24 * 365)', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .post(`/galeries/${galerieId}/invitations`)
                .set('authorization', token)
                .send({ time: 1000 * 60 * 60 * 24 * 365 * 2 });
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: {
                  time: 'should be at most 1 year',
                },
              });
            });
          });
          describe('if numOfInvits', () => {
            it('is not a number', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .post(`/galeries/${galerieId}/invitations`)
                .set('authorization', token)
                .send({ numOfInvit: 'string' });
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: {
                  numOfInvit: FIELD_NOT_A_NUMBER,
                },
              });
            });
            it('is less than 1', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .post(`/galeries/${galerieId}/invitations`)
                .set('authorization', token)
                .send({ numOfInvit: 0 });
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: {
                  numOfInvit: 'should be at least 1',
                },
              });
            });
            it('is more than 200', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .post(`/galeries/${galerieId}/invitations`)
                .set('authorization', token)
                .send({ numOfInvit: 201 });
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: {
                  numOfInvit: 'should be at most 200',
                },
              });
            });
          });
        });
        describe('Should return status 404 if', () => {
          it('galeries not found', async () => {
            const { body, status } = await agent
              .post('/galeries/100/invitations')
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
});
