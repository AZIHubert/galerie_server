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
  describe('GET', () => {
    describe('it should return status 200 and', () => {
      it('return no galerie', async () => {
        const { body, status } = await agent
          .get('/galeries')
          .set('authorization', token);
        expect(status).toEqual(200);
        expect(body.length).toEqual(0);
      });
      it('retun one galerie', async () => {
        const galerieName = 'galerie name';
        const { body: createGalerieBody } = await agent
          .post('/galeries')
          .set('authorization', token)
          .send({ name: galerieName });
        const galerieId = createGalerieBody.id;
        const { body: createFrameBody } = await agent
          .post(`/galeries/${galerieId}/frames`)
          .set('authorization', token)
          .attach('image', `${__dirname}/../../ressources/image.jpg`);
        const pictureId = createFrameBody.galeriePictures[0].id;
        await agent
          .put(`/galeries/${galerieId}`)
          .set('authorization', token)
          .send({ coverPictureId: pictureId });
        const { body, status } = await agent
          .get('/galeries')
          .set('authorization', token);
        expect(status).toEqual(200);
        expect(body.length).toEqual(1);
        const [galerie] = body as Galerie[];
        expect(galerie.name).toEqual(galerieName);
        expect(galerie.id).toEqual(galerieId);
        expect(galerie.coverPictureId).toEqual(pictureId);
        expect(galerie.users.length).toEqual(1);
        expect(galerie.coverPicture.cropedImage.signedUrl).not.toBeNull();
        expect(galerie.coverPicture.originalImage.signedUrl).not.toBeNull();
        expect(galerie.coverPicture.pendingImage.signedUrl).not.toBeNull();
      });
      it('return five galeries', async () => {
        await agent
          .post('/galeries')
          .set('authorization', token)
          .send({ name: 'galerie name' });
        await agent
          .post('/galeries')
          .set('authorization', token)
          .send({ name: 'galerie name' });
        await agent
          .post('/galeries')
          .set('authorization', token)
          .send({ name: 'galerie name' });
        await agent
          .post('/galeries')
          .set('authorization', token)
          .send({ name: 'galerie name' });
        await agent
          .post('/galeries')
          .set('authorization', token)
          .send({ name: 'galerie name' });
        const { body } = await agent
          .get('/galeries')
          .set('authorization', token);
        expect(body.length).toEqual(5);
      });
      it('don\'t return galerie if user is not subscribe to it', async () => {
        const hashPassword = await hash(newUser.password, saltRounds);
        const userTwo = await User.create({
          ...newUser,
          userName: 'user2',
          email: 'user2@email.com',
          confirmed: true,
          password: hashPassword,
        });
        const { body: loginBodyUserTwo } = await agent
          .post('/users/login')
          .send({
            password: newUser.password,
            userNameOrEmail: userTwo.email,
          });
        const tokenTwo = loginBodyUserTwo.token;
        await agent
          .post('/galeries')
          .set('authorization', tokenTwo)
          .send({ name: 'galerie name' });
        const { body } = await agent
          .get('/galeries')
          .set('authorization', token);
        expect(body.length).toEqual(0);
      });
    });
  });
});
