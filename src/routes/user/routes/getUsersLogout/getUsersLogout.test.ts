import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';

import {
  NOT_AUTHENTICATED,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

const clearDatas = async () => {
  await User.sync({ force: true });
};

describe('users', () => {
  let agent: request.SuperAgentTest;
  let app: Server;
  let sequelize: Sequelize;
  let user: User;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas();
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
      });
      await agent.get('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
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
  describe('logout', () => {
    describe('GET', () => {
      describe('should return status 204 and', () => {
        it('logout()', async () => {
          const { status } = await agent.get('/users/logout');
          expect(status).toBe(204);
        });
      });
      describe('should return status 401 and', () => {
        it('be logout', async () => {
          await agent.get('/users/logout');
          const { body, status } = await agent.get('/users/logout');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_AUTHENTICATED,
          });
        });
      });
    });
  });
});
