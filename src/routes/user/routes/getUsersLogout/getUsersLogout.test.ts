import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  let token: string;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
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
      const { body } = await agent.get('/users/login')
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
      await clearDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('logout', () => {
    describe('GET', () => {
      describe('should return status 204 and', () => {
        it('logout', async () => {
          const { status } = await agent
            .get('/users/logout')
            .set('authorization', token);
          expect(status).toBe(204);
        });
      });
    });
  });
});
