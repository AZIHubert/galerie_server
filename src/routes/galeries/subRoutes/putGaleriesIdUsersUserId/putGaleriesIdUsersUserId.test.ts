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
    describe('users', () => {
      describe(':userId', () => {
        describe('PUT', () => {
          describe('should return status 200 and', () => {
            it('and update user\'s role to user if previous role was admin', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                confirmed: true,
                email: 'user2@email.com',
                password: hashPassword,
                userName: 'user2',
              });
              await GalerieUser.create({
                userId: userTwo.id,
                galerieId,
                role: 'admin',
              });
              const { body, status } = await agent
                .put(`/galeries/${galerieId}/users/${userTwo.id}`)
                .set('authorization', token);
              expect(status).toEqual(200);
              expect(body).toStrictEqual({
                id: userTwo.id,
                role: 'user',
              });
              const galerieUser = await GalerieUser.findOne({
                where: {
                  galerieId,
                  userId: userTwo.id,
                },
              });
              if (galerieUser) {
                expect(galerieUser.role).toEqual('user');
              }
            });
            it('and update user\'s role to admin if previous role was user', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                confirmed: true,
                email: 'user2@email.com',
                password: hashPassword,
                userName: 'user2',
              });
              await GalerieUser.create({
                userId: userTwo.id,
                galerieId,
                role: 'user',
              });
              const { body, status } = await agent
                .put(`/galeries/${galerieId}/users/${userTwo.id}`)
                .set('authorization', token);
              expect(status).toEqual(200);
              expect(body).toStrictEqual({
                id: userTwo.id,
                role: 'admin',
              });
              const galerieUser = await GalerieUser.findOne({
                where: {
                  galerieId,
                  userId: userTwo.id,
                },
              });
              if (galerieUser) {
                expect(galerieUser.role).toEqual('admin');
              }
            });
          });
          describe('should return status 400', () => {
            it('if userId and current user id are the same', async () => {
              const { body, status } = await agent
                .delete(`/galeries/100/users/${user.id}`)
                .set('authorization', token);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'you cannot delete yourself',
              });
            });
            it('if current user role in this galerie is "user"', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                confirmed: true,
                email: 'user2@email.com',
                password: hashPassword,
                userName: 'user2',
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
                .put(`/galeries/${galerieId}/users/100`)
                .set('authorization', tokenTwo);
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: 'you should be an admin or the creator to update the role of a user',
              });
            });
            it('if userId role is creator', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                confirmed: true,
                email: 'user2@email.com',
                password: hashPassword,
                userName: 'user2',
              });
              await GalerieUser.create({
                userId: userTwo.id,
                galerieId,
                role: 'admin',
              });
              const { body: { token: tokenTwo } } = await agent
                .post('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.email,
                });
              const { body, status } = await agent
                .put(`/galeries/${galerieId}/users/${user.id}`)
                .set('authorization', tokenTwo);
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: 'you can\'t change the role of the creator of this galerie',
              });
            });
            it('if userId role is admin and current user role is admin', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const hashPassword = await hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                ...newUser,
                confirmed: true,
                email: 'user2@email.com',
                password: hashPassword,
                userName: 'user2',
              });
              const userThree = await User.create({
                ...newUser,
                confirmed: true,
                email: 'user3@email.com',
                password: hashPassword,
                userName: 'user3',
              });
              await GalerieUser.create({
                userId: userTwo.id,
                galerieId,
                role: 'admin',
              });
              await GalerieUser.create({
                userId: userThree.id,
                galerieId,
                role: 'admin',
              });
              const { body: { token: tokenTwo } } = await agent
                .post('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.email,
                });
              const { body, status } = await agent
                .put(`/galeries/${galerieId}/users/${userThree.id}`)
                .set('authorization', tokenTwo);
              expect(status).toEqual(400);
              expect(body).toStrictEqual({
                errors: 'you should be the creator of this galerie to update the role of an admin',
              });
            });
          });
          describe('should return status 404', () => {
            it('if galerie not found', async () => {
              const { body, status } = await agent
                .put('/galeries/100/users/100')
                .set('authorization', token);
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: 'galerie not found',
              });
            });
            it('if user not found', async () => {
              const { body: { id: galerieId } } = await agent
                .post('/galeries')
                .set('authorization', token)
                .send({ name: 'galerie name' });
              const { body, status } = await agent
                .put(`/galeries/${galerieId}/users/100`)
                .set('authorization', token);
              expect(status).toEqual(404);
              expect(body).toStrictEqual({
                errors: 'user not found',
              });
            });
          });
        });
      });
    });
  });
});
