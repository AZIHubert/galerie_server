import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const clearDatas = async () => {
  await User.sync({ force: true });
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
      await clearDatas();
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
      await clearDatas();
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('login', () => {
    describe('POST', () => {
      describe('should return status 204', () => {
        it('set cookie', async () => {
          const { headers, status } = await request(app)
            .get('/users/login')
            .send({
              password: newUser.password,
              userNameOrEmail: user.userName,
            });
          expect(status).toBe(204);
          expect(headers['set-cookie'][0]).toMatch(/sid=/);
        });
      });
    });
  });
});
