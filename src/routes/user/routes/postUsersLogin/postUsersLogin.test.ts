import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_NOT_A_STRING,
  FIELD_IS_REQUIRED,
  WRONG_PASSWORD,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
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
    } catch (err) {
      done(err);
    }
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
    done();
  });
  describe('login', () => {
    describe('POST', () => {
      describe('should return status 200', () => {
        it('set cookie', async () => {
          const { headers, status } = await request(app)
            .get('/users/login')
            .send({
              userNameOrEmail: user.userName,
              password: newUser.password,
            });
          expect(status).toBe(200);
          expect(headers['set-cookie'][0]).toMatch(/sid=/);
        });
        it('return token', async () => {
          const { body, status } = await request(app)
            .get('/users/login')
            .send({
              userNameOrEmail: user.userName,
              password: newUser.password,
            });
          expect(status).toBe(200);
          expect(typeof body.token).toBe('string');
          expect(body.expiresIn).toBe('30m');
        });
      });
      describe('if username or email', () => {
        it('is empty', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: '',
              password: newUser.password,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userNameOrEmail: FIELD_IS_EMPTY,
            },
          });
        });
        it('is not a string', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: 123456789,
              password: newUser.password,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userNameOrEmail: FIELD_NOT_A_STRING,
            },
          });
        });
        it('is not send', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              password: newUser.password,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              userNameOrEmail: FIELD_IS_REQUIRED,
            },
          });
        });
      });
      describe('if password', () => {
        it('is empty', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: user.email,
              password: '',
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_EMPTY,
            },
          });
        });
        it('is not a string', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: user.userName,
              password: 123456789,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_NOT_A_STRING,
            },
          });
        });
        it('is not send', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: user.email,
            });
          expect(status).toBe(400);
          expect(body).toStrictEqual({
            errors: {
              password: FIELD_IS_REQUIRED,
            },
          });
        });
        it('not match', async () => {
          const { body, status } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: user.email,
              password: 'wrongPassword',
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
