import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Image,
  Invitation,
  ProfilePicture,
  Frame,
  GaleriePicture,
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';
import accEnv from '@src/helpers/accEnv';
import gc from '@src/helpers/gc';
import {
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const GALERIES_BUCKET_PP = accEnv('GALERIES_BUCKET_PP');
const GALERIES_BUCKET_PP_CROP = accEnv('GALERIES_BUCKET_PP_CROP');
const GALERIES_BUCKET_PP_PENDING = accEnv('GALERIES_BUCKET_PP_PENDING');

const cleanDatas = async (sequelize: Sequelize) => {
  await Image.sync({ force: true });
  await ProfilePicture.sync({ force: true });
  await User.sync({ force: true });
  await Galerie.sync({ force: true });
  await GalerieUser.sync({ force: true });
  await Invitation.sync({ force: true });
  await Frame.sync({ force: true });
  await GaleriePicture.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};
const cleanGoogleBuckets = async () => {
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
  pseudonym: 'userName',
  userName: '@userName',
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
      await cleanGoogleBuckets();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('me', () => {
    describe('DELETE', () => {
      describe('should return status 204 and', () => {
        it('delete user', async () => {
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const users = await User.findAll();
          expect(status).toBe(204);
          expect(users.length).toBe(0);
        });
        it('delete all profile pictures', async () => {
          await agent
            .post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const profilePictures = await ProfilePicture.findAll();
          expect(status).toBe(204);
          expect(profilePictures.length).toBe(0);
        });
        it('delete all profile picture\'s original images', async () => {
          await agent
            .post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const originalImage = await Image.findAll({
            where: {
              bucketName: GALERIES_BUCKET_PP,
            },
          });
          expect(status).toBe(204);
          expect(originalImage.length).toBe(0);
        });
        it('delete all profile picture\'s original image\'s files', async () => {
          await agent
            .post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
          expect(status).toBe(204);
          expect(originalImages.length).toBe(0);
        });
        it('delete all profile picture\'s croped images', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const cropedImages = await Image.findAll({
            where: {
              bucketName: GALERIES_BUCKET_PP_CROP,
            },
          });
          expect(status).toBe(204);
          expect(cropedImages.length).toBe(0);
        });
        it('delete all profile picture\'s croped image\'s files', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const [cropedImages] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
          expect(status).toBe(204);
          expect(cropedImages.length).toBe(0);
        });
        it('delete all profile picture\'s pending images', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const pendingImages = await Image.findAll({
            where: {
              bucketName: GALERIES_BUCKET_PP_PENDING,
            },
          });
          expect(status).toBe(204);
          expect(pendingImages.length).toBe(0);
        });
        it('delete all profile picture\'s pending image\'s files', async () => {
          await agent.post('/users/me/ProfilePictures')
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const [pendingImages] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
          expect(status).toBe(204);
          expect(pendingImages.length).toBe(0);
        });
        it('don\'t delete other profile pictures', async () => {
          const hashPassword = await hash(newUser.password, saltRounds);
          const userTwo = await User.create({
            ...newUser,
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
              userNameOrEmail: userTwo.email,
            });
          await agentTwo.post('/users/me/ProfilePictures')
            .set('authorization', tokenTwo)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const profilePictures = await ProfilePicture.findAll();
          const images = await Image.findAll();
          const [originalImages] = await gc.bucket(GALERIES_BUCKET_PP).getFiles();
          const [cropedImages] = await gc.bucket(GALERIES_BUCKET_PP_CROP).getFiles();
          const [pendingImages] = await gc.bucket(GALERIES_BUCKET_PP_PENDING).getFiles();
          expect(status).toBe(204);
          expect(profilePictures.length).toBe(1);
          expect(images.length).toBe(3);
          expect(originalImages.length).toBe(1);
          expect(cropedImages.length).toBe(1);
          expect(pendingImages.length).toBe(1);
        });
        it('should destroy all galeries', async () => {
          const { body: { id: galerieId } } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({ name: 'galerie name' });
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const galerie = await Galerie.findByPk(galerieId);
          const galerieUsers = await GalerieUser.findAll();
          expect(status).toBe(204);
          expect(galerie).toBeNull();
          expect(galerieUsers.length).toEqual(0);
        });
        it('should archive galeries if one user is still subscribe', () => {});
        it('should destroy all invitations create by the user', async () => {
          const { body: { id: galerieId } } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({ name: 'galerie name' });
          await agent
            .post(`/galeries/${galerieId}/invitations`)
            .set('authorization', token)
            .send({});
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          expect(status).toBe(204);
          const invitations = await Invitation.findAll({
            where: {
              userId: user.id,
            },
          });
          expect(invitations.length).toEqual(0);
        });
        it('should destroy all invitation from user\'s created galerie', () => {});
        it('should destroy all frames', async () => {
          const { body: { id: galerieId } } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({ name: 'galerie name' });
          await agent
            .post(`/galeries/${galerieId}/frames`)
            .set('authorization', token)
            .attach('image', `${__dirname}/../../ressources/image.jpg`);
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          const frames = await Frame.findAll();
          const galeriePictures = await GaleriePicture.findAll();
          const images = await Image.findAll();
          expect(status).toBe(204);
          expect(frames.length).toEqual(0);
          expect(galeriePictures.length).toEqual(0);
          expect(images.length).toEqual(0);
          // check google storage image
        });
        it('should destroy all likes', () => {});
        it('logout', async () => {
          const { status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: newUser.password,
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          expect(status).toBe(204);
        });
      });
      describe('should return status 400', () => {
        it('password not send', async () => {
          const { body, status } = await agent
            .delete('/users/me/')
            .set('authorization', token);
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_REQUIRED,
            },
          });
        });
        it('password dosen\'t match', async () => {
          const { body, status } = await agent
            .delete('/users/me/')
            .set('authorization', token)
            .send({
              password: 'wrong password',
              userNameOrEmail: user.email,
              deleteAccountSentence: 'delete my account',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: WRONG_PASSWORD,
            },
          });
        });
      });
    });
  });
});
