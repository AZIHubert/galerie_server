import bcrypt from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import Image from '@src/db/models/image';
import User from '@src/db/models/user';
import ProfilePicture from '@src/db/models/profilePicture';
import { createAccessToken } from '@src/helpers/auth';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
  USER_NOT_FOUND,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
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
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    try {
      await Image.sync({ force: true });
      await ProfilePicture.sync({ force: true });
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await Image.sync({ force: true });
      await ProfilePicture.sync({ force: true });
      await User.sync({ force: true });
      await sequelize.close();
      app.close();
      done();
    } catch (err) {
      done(err);
    }
  });
  describe('logout', () => {
    describe('GET', () => {
      describe('should return status 204 and', () => {
        it('should clear cookie', async () => {
          const password = 'Aaoudjiuvhds9';
          const hashPassword = await bcrypt.hash(password, saltRounds);
          const user = await User.create({
            ...newUser,
            password: hashPassword,
            confirmed: true,
          });
          const agent = request.agent(app);
          const { body: { accessToken } } = await agent
            .get('/users/login')
            .send({
              userNameOrEmail: user.userName,
              password,
            });
          const { headers, status } = await agent
            .get('/users/logout')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(204);
          expect(headers['set-cookie'][0]).toMatch('jid=;');
        });
      });
      describe('should return status 401 if', () => {
        it('user not logged in', async () => {
          const { body, status } = await request(initApp())
            .get('/users/logout');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_AUTHENTICATED,
          });
        });
        it('token is not \'Bearer ...\'', async () => {
          const { body, status } = await request(initApp())
            .get('/users/logout')
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
          const { body, status } = await request(initApp())
            .get('/users/logout')
            .set('authorization', 'Bearer token');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: WRONG_TOKEN_VERSION,
          });
        });
        it('user is not confirmed', async () => {
          const user = await User.create(newUser);
          const token = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/logout')
            .set('authorization', `Bearer ${token}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
      });
      describe('should return status 404 if', () => {
        it('user not found', async () => {
          jest.spyOn(jwt, 'verify')
            .mockImplementationOnce(() => ({ id: 1, authTokenVersion: 0 }));
          const { body, status } = await request(initApp())
            .get('/users/logout')
            .set('authorization', 'Bearer token');
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: USER_NOT_FOUND,
          });
        });
      });
    });
  });
});
