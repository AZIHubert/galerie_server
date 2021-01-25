import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

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
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
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
              password: newUser.password,
              userNameOrEmail: user.userName,
            });
          expect(status).toBe(200);
          expect(headers['set-cookie'][0]).toMatch(/sid=/);
        });
        it('return token', async () => {
          const { body, status } = await request(app)
            .get('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: user.userName,
            });
          expect(status).toBe(200);
          expect(typeof body.token).toBe('string');
          expect(body.expiresIn).toBe('1d');
        });
      });
    });
  });
});
