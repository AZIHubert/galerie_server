import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Ticket,
  User,
} from '@src/db/models';

import initSequelize from '@src/helpers/initSequelize.js';
import saltRounds from '@src/helpers/saltRounds';
import initApp from '@src/server';

const cleanDatas = async (sequelize: Sequelize) => {
  await Ticket.sync({ force: true });
  await User.sync({ force: true });
  await sequelize.model('Sessions').sync({ force: true });
};

const newUser = {
  email: 'user@email.com',
  password: 'password',
  userName: 'userName',
};

describe('tickets', () => {
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
      await cleanDatas(sequelize);
      const hashPassword = await hash(newUser.password, saltRounds);
      user = await User.create({
        ...newUser,
        confirmed: true,
        role: 'superAdmin',
        password: hashPassword,
      });
      const { body } = await agent
        .get('/users/login')
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
      await cleanDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe(':id', () => {
    describe('DELETE', () => {
      describe('should return status 200 and', () => {
        let userTwo: User;
        beforeEach(async (done) => {
          try {
            const hashPassword = await hash(newUser.password, saltRounds);
            userTwo = await User.create({
              userName: 'user2',
              email: 'user2@email.com',
              password: hashPassword,
              confirmed: true,
            });
            const agentTwo = request.agent(app);
            const { body: { token: tokenTwo } } = await agentTwo
              .get('/users/login')
              .send({
                password: newUser.password,
                userNameOrEmail: userTwo.userName,
              });
            await agentTwo
              .post('/tickets/')
              .set('authorization', tokenTwo)
              .send({
                header: 'ticket header',
                body: 'ticket body',
              });
          } catch (err) {
            done(err);
          }
          done();
        });
        it('delete ticket', async () => {
          const ticket = await Ticket.findOne({
            where: {
              userId: userTwo.id,
            },
          });
          const { status } = await agent
            .delete(`/tickets/${ticket!.id}`)
            .set('authorization', token);
          const deletedTicket = await Ticket.findOne({
            where: {
              userId: userTwo.id,
            },
          });
          expect(status).toBe(200);
          expect(deletedTicket).toBeNull();
        });
        it('return the deleted ticket\'s id', async () => {
          const ticket = await Ticket.findOne({
            where: {
              userId: userTwo.id,
            },
          });
          const { id } = ticket!;
          const { body, status } = await agent
            .delete(`/tickets/${id}`)
            .set('authorization', token);
          expect(status).toBe(200);
          expect(body).toStrictEqual({ id });
        });
      });
      describe('should return status 404 if', () => {
        it('token :id doesn\'t exist', async () => {
          const { body, status } = await agent
            .delete('/tickets/1')
            .set('authorization', token);
          expect(status).toBe(404);
          expect(body).toStrictEqual({
            errors: 'ticket not found',
          });
        });
      });
    });
  });
});
