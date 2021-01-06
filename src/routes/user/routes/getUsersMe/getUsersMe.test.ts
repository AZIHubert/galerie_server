import request from 'supertest';

import '@src/helpers/initEnv';

import { createAccessToken } from '@src/helpers/auth';
import User from '@src/db/models/user';
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
    done();
  });
  describe('me', () => {
    describe('GET', () => {
      it('should return own account', async () => {
        const user = await User.create({
          userName: 'user',
          email: 'user@email.com',
          password: 'Aaoudjiuvhds9!',
          confirmed: true,
          tokenVersion: 0,
          admin: false,
        });
        const accessToken = createAccessToken(user);
        const { body, status } = await request(initApp())
          .get('/users/me')
          .set('authorization', `Bearer ${accessToken}`);
        expect(status).toBe(200);
        expect(body.userName).toStrictEqual(user.userName);
        expect(body.email).toStrictEqual(body.email);
        expect(body.password).toStrictEqual(body.password);
        expect(body.admin).toStrictEqual(body.admin);
      });
      describe('should return 401 if not', () => {
        it('logged in', async () => {
          await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: 'Aaoudjiuvhds9!',
            confirmed: true,
            tokenVersion: 0,
            admin: false,
          });
          const { body, status } = await request(initApp()).get('/users/me');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'not authenticated',
          });
        });
        it('confirmed', async () => {
          const user = await User.create({
            userName: 'user',
            email: 'user@email.com',
            password: 'Aaoudjiuvhds9!',
            confirmed: false,
            tokenVersion: 0,
            admin: false,
          });
          const accessToken = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: 'You\'re account need to be confimed',
          });
        });
      });
    });
  });
});
