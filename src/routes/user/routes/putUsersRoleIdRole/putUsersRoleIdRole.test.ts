import bcrypt from 'bcrypt';
import { Server } from 'http';
// import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import {
  // NOT_AUTHENTICATED,
  // NOT_CONFIRMED,
  NOT_SUPER_ADMIN,
  USER_NOT_FOUND,
  // WRONG_TOKEN,
  // WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
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
      await clearDatas();
      const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
        role: 'superAdmin',
      });
      await agent
        .get('/users/login')
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
  describe('role', () => {
    describe(':id', () => {
      describe(':role', () => {
        describe('PUT', () => {
          describe('should return status 204 and', () => {
            it('should set role to \'user\' if :role === user.role', async () => {
              const userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'admin',
              });
              const { id, role } = userTwo;
              const { status } = await agent
                .put(`/users/role/${id}/${role}`);
              await userTwo.reload();
              expect(status).toBe(204);
              expect(userTwo.role).toBe('user');
            });
            it('should update role if user.role !== :user', async () => {
              const userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'user',
              });
              const { id } = userTwo;
              const { status: adminStatus } = await agent
                .put(`/users/role/${id}/admin`);
              await userTwo.reload();
              expect(adminStatus).toBe(204);
              expect(userTwo.role).toBe('admin');
              const { status: superAdminStatus } = await agent
                .put(`/users/role/${id}/superAdmin`);
              await userTwo.reload();
              expect(superAdminStatus).toBe(204);
              expect(userTwo.role).toBe('superAdmin');
            });
          });
          describe('should return status 400 if', () => {
            it(':role is not admin or superAdmin', async () => {
              const { id } = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'user',
              });
              const { body, status } = await agent
                .put(`/users/role/${id}/wrongRole`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'role should be admin or superAdmin',
              });
            });
            it(':role is user', async () => {
              const { id } = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'user',
              });
              const { body, status } = await agent
                .put(`/users/role/${id}/user`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'role should not be user',
              });
            });
            it(':id is the same as current one', async () => {
              const { body, status } = await agent
                .put(`/users/role/${user.id}/superAdmin`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'you can\'t modify your role yourself',
              });
            });
            it('user :id is already a super admin', async () => {
              const { id } = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'superAdmin',
              });
              const { body, status } = await agent
                .put(`/users/role/${id}/superAdmin`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'user is already a super admin',
              });
            });
          });
          describe('should return status 401 if', () => {
            it('user role is admin', async () => {
              const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: hashPassword,
                confirmed: true,
                role: 'admin',
              });
              const { id } = await User.create({
                userName: 'user3',
                email: 'user3@email.com',
                password: 'password',
                confirmed: true,
                role: 'superAdmin',
              });
              const agentTwo = request.agent(app);
              await agentTwo
                .get('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.userName,
                });
              const { body, status } = await agentTwo
                .put(`/users/role/${id}/admin`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_SUPER_ADMIN,
              });
            });
            it('user role is user', async () => {
              const hashPassword = await bcrypt.hash(newUser.password, saltRounds);
              const userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: hashPassword,
                confirmed: true,
              });
              const { id } = await User.create({
                userName: 'user3',
                email: 'user3@email.com',
                password: 'password',
                confirmed: true,
                role: 'superAdmin',
              });
              const agentTwo = request.agent(app);
              await agentTwo
                .get('/users/login')
                .send({
                  password: newUser.password,
                  userNameOrEmail: userTwo.userName,
                });
              const { body, status } = await agentTwo
                .put(`/users/role/${id}/admin`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_SUPER_ADMIN,
              });
            });
          });
          describe('should return status 404 if', () => {
            it('user :id not found', async () => {
              const { body, status } = await agent
                .put('/users/role/1000/superAdmin');
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
            it('user :id is not confirmed', async () => {
              const { id } = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
              });
              const { body, status } = await agent
                .put(`/users/role/${id}/superAdmin`);
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
          });
        });
      });
    });
  });
});
