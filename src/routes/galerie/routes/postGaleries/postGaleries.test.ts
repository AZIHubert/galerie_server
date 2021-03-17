import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Galerie,
  GalerieUser,
  User,
} from '@src/db/models';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

import {
  FIELD_IS_REQUIRED,
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MIN_LENGTH_OF_THREE,
  FIELD_NOT_A_STRING,
} from '@src/helpers/errorMessages';

const cleanDatas = async (sequelize: Sequelize) => {
  await Galerie.sync({ force: true });
  await GalerieUser.sync({ force: true });
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

const newUser = {
  pseudonym: 'userName',
  email: 'user@email.com',
  password: 'password',
  userName: '@userName',
};

describe('galerie', () => {
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
  describe('POST', () => {
    describe('should return status 200', () => {
      it('and create a galerie', async () => {
        const name = 'galerie name';
        const { body, status } = await agent
          .post('/galeries/')
          .set('authorization', token)
          .send({ name });
        expect(status).toEqual(200);
        const galerie = await Galerie.findByPk(body.id, {
          include: [{
            model: User,
          }],
        });
        expect(galerie).not.toBeNull();
        if (galerie) {
          expect(galerie.name).toEqual(name);
          expect(galerie.users.length).toBe(1);
          expect(galerie.users[0].id).toBe(user.id);
          expect(galerie.users[0].GalerieUser.role).toEqual('creator');
        }
      });
    });
    describe('should return status 400', () => {
      describe('if name', () => {
        it('is empty', async () => {
          const { body, status } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({});
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              name: FIELD_IS_REQUIRED,
            },
          });
        });
        it('is empty', async () => {
          const { body, status } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({
              name: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              name: FIELD_IS_EMPTY,
            },
          });
        });
        it('is less than 3 characters', async () => {
          const { body, status } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({
              name: 'a'.repeat(2),
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              name: FIELD_MIN_LENGTH_OF_THREE,
            },
          });
        });
        it('is more than 30 characters', async () => {
          const { body, status } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({
              name: 'a'.repeat(31),
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              name: FIELD_MAX_LENGTH_THRITY,
            },
          });
        });
        it('is not a string', async () => {
          const { body, status } = await agent
            .post('/galeries/')
            .set('authorization', token)
            .send({
              name: 1234567890,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              name: FIELD_NOT_A_STRING,
            },
          });
        });
      });
    });
  });
});
