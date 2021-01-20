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
  describe('blackList', () => {
    describe(':id', () => {
      describe('PUT', () => {
        describe('should return status 204 and', () => {
          it('should unblack listed a user', async () => {
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'user',
              blackListed: true,
            });
            const user = await User.create({
              ...newUser,
              confirmed: true,
              role: 'admin',
            });
            const token = createAccessToken(user);
            const { status } = await request(app)
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', `Bearer ${token}`);
            await userTwo.reload();
            expect(status).toBe(204);
            expect(userTwo.blackListed).toBe(false);
          });
          it('should black list an user and set is role to user', async () => {
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'admin',
            });
            const user = await User.create({
              ...newUser,
              confirmed: true,
              role: 'superAdmin',
            });
            const token = createAccessToken(user);
            const { status } = await request(app)
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', `Bearer ${token}`);
            await userTwo.reload();
            expect(status).toBe(204);
            expect(userTwo.blackListed).toBe(true);
            expect(userTwo.role).toBe('user');
          });
        });
        describe('should return status 401 if', () => {
          it('user not logged in', async () => {
            const { body, status } = await request(app)
              .put('/users/blackList/1');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_AUTHENTICATED,
            });
          });
          it('token is not \'Bearer ...\'', async () => {
            const { body, status } = await request(app)
              .put('/users/blackList/1')
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
              .put('/users/blackList/1')
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
              .put('/users/blackList/1')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_CONFIRMED,
            });
          });
          it('user role is user', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .put('/users/blackList/1')
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: NOT_SUPER_ADMIN,
            });
          });
          it('user.id and :id are the same', async () => {
            const user = await User.create({
              ...newUser,
              confirmed: true,
              role: 'admin',
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .put(`/users/blackList/${user.id}`)
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'you can\'t put your account on the black list',
            });
          });
          it('user :id role is superAdmin', async () => {
            const { id } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'superAdmin',
            });
            const user = await User.create({
              ...newUser,
              confirmed: true,
              role: 'admin',
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .put(`/users/blackList/${id}`)
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'you can black listed a super admin',
            });
          });
          it('current user is admin and user :id is admin', async () => {
            const { id } = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'admin',
            });
            const user = await User.create({
              ...newUser,
              confirmed: true,
              role: 'admin',
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .put(`/users/blackList/${id}`)
              .set('authorization', `Bearer ${token}`);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'you can black listed an admin',
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user not found', async () => {
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id: 1, authTokenVersion: 0 }));
            const { body, status } = await request(app)
              .put('/users/blackList/1')
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
              role: 'admin',
            });
            const token = createAccessToken(user);
            const { body, status } = await request(app)
              .put('/users/blackList/1000')
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
