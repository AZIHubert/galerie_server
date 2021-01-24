import { hash } from 'bcrypt';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { User } from '@src/db/models';
import {
  FIELD_IS_REQUIRED,
  TOKEN_NOT_FOUND,
  WRONG_PASSWORD,
  WRONG_TOKEN,
  WRONG_TOKEN_VERSION,
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
  userName: 'user',
};

describe('users', () => {
  const updatedEmail = 'user2@email.com';
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
  afterEach(() => {
    jest.restoreAllMocks();
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

  describe('me', () => {
    describe('updateEmail', () => {
      describe('put', () => {
        describe('should return status 204', () => {
          let response: request.Response;
          beforeEach(async (done) => {
            const { id, updatedEmailTokenVersion } = user;
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, updatedEmailTokenVersion, updatedEmail }));
            try {
              response = await agent
                .put('/users/me/updateEmail')
                .set('confirmation', 'Bearer token')
                .send({ password: newUser.password });
            } catch (err) {
              done(err);
            }
            done();
          });
          it('should increment updatedEmailTokenVersion', async () => {
            const { updatedEmailTokenVersion } = user;
            const { status } = response;
            await user.reload();
            expect(status).toBe(204);
            expect(user.updatedEmailTokenVersion).toBe(updatedEmailTokenVersion + 1);
          });
          it('should update user email', async () => {
            const { status } = response;
            await user.reload();
            expect(status).toBe(204);
            expect(user.email).toBe(updatedEmail);
          });
        });
        describe('should return error 400 if', () => {
          it('if passwords not match', async () => {
            const { id, updatedEmailTokenVersion } = user;
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id,
                updatedEmailTokenVersion,
                updatedEmail,
              }));
            const { body, status } = await agent
              .put('/users/me/updateEmail')
              .set('confirmation', 'Bearer token')
              .send({
                password: 'wrongPassword',
              });
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: WRONG_PASSWORD,
              },
            });
          });
          it('if password not send', async () => {
            const { id, updatedEmailTokenVersion } = user;
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id,
                updatedEmailTokenVersion,
                updatedEmail,
              }));
            const { body, status } = await agent
              .put('/users/me/updateEmail')
              .set('confirmation', 'Bearer token')
              .send({});
            expect(status).toBe(400);
            expect(body).toStrictEqual({
              errors: {
                password: FIELD_IS_REQUIRED,
              },
            });
          });
        });
        describe('should return error 401 if', () => {
          it('if updatedEmail is not found in token', async () => {
            const { id, updatedEmailTokenVersion } = user;
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({ id, updatedEmailTokenVersion }));
            const { body, status } = await agent
              .put('/users/me/updateEmail')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'updated email not found',
            });
          });
          it('updatedEmailTokenVersion is not the same as current user updatedEmailTokenVersion', async () => {
            const { id, updatedEmailTokenVersion } = user;
            jest.spyOn(jwt, 'verify')
              .mockImplementationOnce(() => ({
                id,
                updatedEmailTokenVersion: updatedEmailTokenVersion + 1,
              }));
            const { body, status } = await agent
              .put('/users/me/updateEmail')
              .set('confirmation', 'Bearer token');
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: WRONG_TOKEN_VERSION,
            });
          });
          describe('confirmation token is not', () => {
            it('set', async () => {
              const { body, status } = await agent
                .put('/users/me/updateEmail');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: TOKEN_NOT_FOUND,
              });
            });
            it('\'Bearer ...\'', async () => {
              const { body, status } = await agent
                .put('/users/me/updateEmail')
                .set('confirmation', 'token');
              expect(status).toBe(401);
              expect(body).toStrictEqual({
                errors: WRONG_TOKEN,
              });
            });
          });
        });
      });
    });
  });
});
