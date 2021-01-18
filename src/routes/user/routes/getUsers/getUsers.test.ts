import request from 'supertest';

import '@src/helpers/initEnv';

import User from '@src/db/models/user';
import { createAccessToken } from '@src/helpers/auth';
import {
  NOT_AUTHENTICATED,
  NOT_CONFIRMED,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import initApp from '@src/server';

const sequelize = initSequelize();

describe('users', () => {
  beforeEach(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    done();
  });
  afterAll(async (done) => {
    try {
      await User.sync({ force: true });
    } catch (err) {
      done(err);
    }
    sequelize.close();
  });
  describe('GET', () => {
    describe('should return status 200 and', () => {
      it('get all users', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          confirmed: true,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(initApp())
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(body.length).toBe(1);
        expect(status).toBe(200);
      });
    });
    describe('Should return error 401 if', () => {
      it('not authenticated', async () => {
        const { body, status } = await request(initApp())
          .get('/users');
        expect(status).toBe(401);
        expect(body).toStrictEqual({
          errors: NOT_AUTHENTICATED,
        });
      });
      it('not confirmed', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          confirmed: false,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(initApp())
          .get('/users')
          .set('authorization', ` Bearer ${accessToken}`);
        expect(status).toBe(401);
        expect(body).toStrictEqual({
          errors: NOT_CONFIRMED,
        });
      });
    });
  });
});
