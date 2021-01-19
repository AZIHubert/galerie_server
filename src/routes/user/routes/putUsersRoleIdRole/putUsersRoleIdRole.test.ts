import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import { createAccessToken } from '@src/helpers/auth';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  NOT_SUPER_ADMIN,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const newUser = {
  userName: 'userName',
  email: 'user@email.com',
  password: 'password',
};

describe('users', () => {
  let sequelize: Sequelize;
  let app: Server;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
      done();
    } catch (err) {
      done(err);
    }
  });
  afterAll(async (done) => {
    try {
      await User.sync({ force: true });
      await sequelize.close();
      app.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('role', () => {
    describe(':id', () => {
      describe(':role', () => {
        describe('PUT', () => {
          describe('should return status 204 and', () => {
            it('should set role to \'user\' if :role === user.role', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'admin',
              });
              const { id, role } = userTwo;
              const token = createAccessToken(user);
              const { status } = await request(app)
                .put(`/users/role/${id}/${role}`)
                .set('authorization', `Bearer ${token}`);
              await userTwo.reload();
              expect(status).toBe(204);
              expect(userTwo.role).toBe('user');
            });
            it('should update role if user.role !== :user', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'user',
              });
              const { id } = userTwo;
              const token = createAccessToken(user);
              const { status: adminStatus } = await request(app)
                .put(`/users/role/${id}/admin`)
                .set('authorization', `Bearer ${token}`);
              await userTwo.reload();
              expect(adminStatus).toBe(204);
              expect(userTwo.role).toBe('admin');
              const { status: superAdminStatus } = await request(app)
                .put(`/users/role/${id}/superAdmin`)
                .set('authorization', `Bearer ${token}`);
              await userTwo.reload();
              expect(superAdminStatus).toBe(204);
              expect(userTwo.role).toBe('superAdmin');
            });
          });
          describe('should return status 400 if', () => {
            it(':role is not admin or superAdmin', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put('/users/role/100/wrongRole')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'role should be admin or superAdmin',
              });
            });
            it(':role is user', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put('/users/role/100/user')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'role should not be user',
              });
            });
            it(':id is the same as current one', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put(`/users/role/${user.id}/superAdmin`)
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'you can\'t modify your role yourself',
              });
            });
            it('user :id is already a super admin', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const { id } = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
                role: 'superAdmin',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put(`/users/role/${id}/superAdmin`)
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: 'user is already a super admin',
              });
            });
          });
          describe('should return status 401 if', () => {
            it('user not logged in', async () => {
              const { body, status } = await request(app)
                .put('/users/role/1/admin');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_AUTHENTICATED,
              });
            });
            it('token is not \'Bearer ...\'', async () => {
              const { body, status } = await request(app)
                .put('/users/role/1/admin')
                .set('authorization', 'token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN,
              });
            });
            it('authTokenVersions not match', async () => {
              const { id } = await User.create(newUser);
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id, authTokenVersion: 1 }));
              const { body, status } = await request(app)
                .put('/users/role/1/admin')
                .set('authorization', 'Bearer token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN_VERSION,
              });
            });
            it('user is not confirmed', async () => {
              const user = await User.create(newUser);
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put('/users/role/1/admin')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_CONFIRMED,
              });
            });
            it('user role is admin', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'admin',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put('/users/role/1/admin')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_SUPER_ADMIN,
              });
            });
            it('user role is user', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put('/users/role/1/admin')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: NOT_SUPER_ADMIN,
              });
            });
          });
          describe('should return status 404 if', () => {
            it('user not found', async () => {
              jest.spyOn(jwt, 'verify')
                .mockImplementationOnce(() => ({ id: 1, authTokenVersion: 0 }));
              const { body, status } = await request(app)
                .put('/users/role/1/admin')
                .set('authorization', 'Bearer token');
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
            it('user :id not found', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put('/users/role/1000/superAdmin')
                .set('authorization', `Bearer ${token}`);
              expect(status).toBe(404);
              expect(body).toStrictEqual({
                errors: USER_NOT_FOUND,
              });
            });
            it('user :id is not confirmed', async () => {
              const user = await User.create({
                ...newUser,
                confirmed: true,
                role: 'superAdmin',
              });
              const { id } = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
              });
              const token = createAccessToken(user);
              const { body, status } = await request(app)
                .put(`/users/role/${id}/superAdmin`)
                .set('authorization', `Bearer ${token}`);
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
