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

const newUser = {
  userName: 'user',
  email: 'user@email.com',
  password: 'password',
};

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
      describe('should return status 200 and', () => {
        it('should return own account', async () => {
          const newUserConfirmed = { ...newUser, confirmed: true };
          const user = await User.create(newUserConfirmed);
          const accessToken = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(200);
          expect(body.userName).toStrictEqual(user.userName);
          expect(body.currentProfilePicture).toBeNull();
          expect(body.email).toStrictEqual(body.email);
          expect(body.password).toStrictEqual(body.password);
          expect(body.admin).toStrictEqual(body.admin);
        });
      });
      describe('should return 401 if not', () => {
        it('logged in', async () => {
          const { body, status } = await request(initApp())
            .get('/users/me');
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_AUTHENTICATED,
          });
        });
        it('confirmed', async () => {
          const user = await User.create(newUser);
          const accessToken = createAccessToken(user);
          const { body, status } = await request(initApp())
            .get('/users/me')
            .set('authorization', `Bearer ${accessToken}`);
          expect(status).toBe(401);
          expect(body).toStrictEqual({
            errors: NOT_CONFIRMED,
          });
        });
      });
    });
  });
});
