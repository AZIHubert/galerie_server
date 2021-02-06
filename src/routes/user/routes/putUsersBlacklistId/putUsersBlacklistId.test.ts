import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import { BlackList, User } from '@src/db/models';
import {
  FIELD_IS_REQUIRED,
  FIELD_IS_EMPTY,
  FIELD_MIN_LENGTH_OF_TEN,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_NOT_A_STRING,
  FIELD_NOT_A_NUMBER,
  USER_NOT_FOUND,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const clearDatas = async (sequelize: Sequelize) => {
  await BlackList.sync({ force: true });
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
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
  let token: string;
  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });
  beforeEach(async (done) => {
    agent = request.agent(app);
    try {
      await clearDatas(sequelize);
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        password: hashPassword,
        role: 'superAdmin',
      });
      const { body } = await agent
        .post('/users/login')
        .send({
          password: newUser.password,
          userNameOrEmail: user.userName,
        });
      token = body.token;
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
  describe('blackList', () => {
    describe(':id', () => {
      describe('PUT', () => {
        describe('should return status 204 and', () => {
          it('unblack listed a user', async () => {
            const { id: blackListId } = await BlackList.create({
              reason: 'black listed',
              adminId: user.id,
            });
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'user',
              blackListId,
            });
            const { status } = await agent
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', token);
            await userTwo.reload();
            const blackLists = await BlackList.findAll();
            expect(status).toBe(204);
            expect(userTwo.blackListId).toBeNull();
            expect(blackLists.length).toBe(0);
          });
          it('black list an user and set is role to user', async () => {
            const reason = 'black list user';
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'admin',
            }, { include: [{ model: BlackList }] });
            const { status } = await agent
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', token)
              .send({ reason });
            await userTwo.reload();
            expect(status).toBe(204);
            expect(userTwo.role).toBe('user');
            expect(userTwo.blackList.reason).toBe(reason);
            expect(userTwo.blackList.adminId).toBe(user.id);
            expect(userTwo.blackList.time).toBe(null);
          });
          it('trim reason', async () => {
            const reason = 'black list user';
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'admin',
            }, { include: [{ model: BlackList }] });
            const { status } = await agent
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', token)
              .send({ reason: ` ${reason} ` });
            await userTwo.reload();
            expect(status).toBe(204);
            expect(userTwo.blackList.reason).toBe(reason);
          });
          it('black list a user with a time', async () => {
            const time = 1000 * 60 * 10;
            const reason = 'black list user';
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
              confirmed: true,
              role: 'admin',
            }, { include: [{ model: BlackList }] });
            const { status } = await agent
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', token)
              .send({ reason, time });
            await userTwo.reload();
            expect(status).toBe(204);
            expect(userTwo.blackList.reason).toBe(reason);
            expect(userTwo.blackList.adminId).toBe(user.id);
            expect(userTwo.blackList.time).toBe(time);
          });
        });
        describe('should return status 400 if', () => {
          let userTwo: User;
          beforeEach(async (done) => {
            try {
              userTwo = await User.create({
                userName: 'user2',
                email: 'user2@email.com',
                password: 'password',
                confirmed: true,
              });
            } catch (err) {
              done(err);
            }
            done();
          });
          describe('reason is', () => {
            it('not send', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({});
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  reason: FIELD_IS_REQUIRED,
                },
              });
            });
            it('empty', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason: '' });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  reason: FIELD_IS_EMPTY,
                },
              });
            });
            it('not a string', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason: 1234567890 });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  reason: FIELD_NOT_A_STRING,
                },
              });
            });
            it('less than 10 characters', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason: 'aaaaaaa a' });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  reason: FIELD_MIN_LENGTH_OF_TEN,
                },
              });
            });
            it('more than 200 characters', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason: 'a'.repeat(201) });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  reason: FIELD_MAX_LENGTH_TWO_HUNDRER,
                },
              });
            });
          });
          describe('time', () => {
            const reason = 'black listed';
            it('is not a number', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason, time: 'time' });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  time: FIELD_NOT_A_NUMBER,
                },
              });
            });
            it('is less than 10mn', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason, time: 1000 * 60 * 9 });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  time: 'should be ban at least 10mn',
                },
              });
            });
            it('is more than 1 year', async () => {
              const { body, status } = await agent
                .put(`/users/blackList/${userTwo.id}`)
                .set('authorization', token)
                .send({ reason, time: 1000 * 60 * 60 * 24 * 365 * 2 });
              expect(status).toBe(400);
              expect(body).toStrictEqual({
                errors: {
                  time: 'should be ban at most 1 year',
                },
              });
            });
          });
        });
        describe('should return status 401 if', () => {
          it('user.id and :id are the same', async () => {
            const { body, status } = await agent
              .put(`/users/blackList/${user.id}`)
              .set('authorization', token);
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
            const hashPassword = await hash(newUser.password, saltRounds);
            const userThree = await User.create({
              confirmed: true,
              email: 'user3@email.com',
              password: hashPassword,
              role: 'admin',
              userName: 'user3',
            });
            const agentTwo = request.agent(app);
            const { body: { token: tokenTwo } } = await agentTwo
              .post('/users/login')
              .set('authorization', token)
              .send({
                password: newUser.password,
                userNameOrEmail: userThree.userName,
              });
            const { body, status } = await agentTwo
              .put(`/users/blackList/${id}`)
              .set('authorization', tokenTwo);
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
            const hashPassword = await hash(newUser.password, saltRounds);
            const userThree = await User.create({
              confirmed: true,
              email: 'user3@email.com',
              password: hashPassword,
              role: 'admin',
              userName: 'user3',
            });
            const agentTwo = request.agent(app);
            const { body: { token: tokenTwo } } = await agentTwo
              .post('/users/login')
              .set('authorization', token)
              .send({
                password: newUser.password,
                userNameOrEmail: userThree.userName,
              });
            const { body, status } = await agentTwo
              .put(`/users/blackList/${id}`)
              .set('authorization', tokenTwo);
            expect(status).toBe(401);
            expect(body).toStrictEqual({
              errors: 'you can black listed an admin',
            });
          });
        });
        describe('should return status 404 if', () => {
          it('user :id is not confirmed', async () => {
            const userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: 'password',
            });
            const { body, status } = await agent
              .put(`/users/blackList/${userTwo.id}`)
              .set('authorization', token)
              .send({ reason: 'black list user' });
            expect(status).toBe(404);
            expect(body).toStrictEqual({
              errors: USER_NOT_FOUND,
            });
          });
          it('user :id not found', async () => {
            const { body, status } = await agent
              .put('/users/blackList/1000')
              .set('authorization', token);
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
