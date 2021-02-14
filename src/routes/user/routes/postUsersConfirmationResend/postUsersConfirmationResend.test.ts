import jwt from 'jsonwebtoken';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import * as email from '@src/helpers/email';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  ALREADY_CONFIRMED,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initApp from '@src/server';

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
};

const clearDatas = async (sequelize: Sequelize) => {
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

describe('users', () => {
  let app: Server;
  let sequelize: Sequelize;
  beforeAll(() => {
    app = initApp();
    sequelize = initSequelize();
  });
  beforeEach(async (done) => {
    try {
      await clearDatas(sequelize);
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
  describe('confirmation', () => {
    describe('resend', () => {
      describe('POST', () => {
        describe('should return status 204 and', () => {
          let user: User;
          beforeEach(async (done) => {
            try {
              user = await User.create(newUser);
            } catch (err) {
              done(err);
            }
            done();
          });
          it('increment confirmTokenVersion', async () => {
            const { email: userEmail, confirmTokenVersion } = user;
            const { status } = await request(app)
              .post('/users/confirmation/resend')
              .send({ email: userEmail });
            await user.reload();
            expect(status).toBe(204);
            expect(user!.confirmTokenVersion).toBe(confirmTokenVersion + 1);
          });
          it('sign a token and send an email', async () => {
            const signMocked = jest.spyOn(jwt, 'sign');
            const emailMocked = jest.spyOn(email, 'sendConfirmAccount');
            const { email: userEmail } = user;
            const { status } = await request(app)
              .post('/users/confirmation/resend')
              .send({ email: userEmail });
            expect(status).toBe(204);
            expect(signMocked).toHaveBeenCalledTimes(1);
            expect(emailMocked).toHaveBeenCalledTimes(1);
          });
        });
        describe('should return error 400 if', () => {
          it('id is not send', async () => {
            const { status, body } = await request(app)
              .post('/users/confirmation/resend')
              .send({});
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: 'user email is required',
            });
          });
          it('user is already confirmed', async () => {
            const { email: userEmail } = await User.create({
              userName: 'user',
              email: 'user@email.com',
              password: 'password',
              confirmed: true,
            });
            const { status, body } = await request(app)
              .post('/users/confirmation/resend')
              .send({ email: userEmail });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: ALREADY_CONFIRMED,
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user id not found', async () => {
            const { status, body } = await request(app)
              .post('/users/confirmation/resend')
              .send({ email: 'ufoundEmail@email.com' });
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
