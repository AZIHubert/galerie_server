import { hash } from 'bcrypt';
import { Server } from 'http';
import { Sequelize } from 'sequelize';
import request from 'supertest';

import '@src/helpers/initEnv';

import {
  Ticket,
  User,
} from '@src/db/models';

import {
  FIELD_IS_EMPTY,
  FIELD_MAX_LENGTH_THRITY,
  FIELD_MAX_LENGTH_TWO_HUNDRER,
  FIELD_NOT_A_STRING,
  FIELD_IS_REQUIRED,
  FIELD_MIN_LENGTH_OF_FIVE,
  FIELD_MIN_LENGTH_OF_TEN,
} from '@src/helpers/errorMessages';
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
        password: hashPassword,
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
      await cleanDatas(sequelize);
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });
  describe('POST', () => {
    describe('should return status 204 and', () => {
      it('create a ticket', async () => {
        const body = 'ticket body';
        const header = 'header body';
        const { status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({ body, header });
        const tickets = await Ticket.findAll();
        expect(status).toBe(204);
        expect(tickets.length).toBe(1);
        expect(tickets[0].body).toBe(body);
        expect(tickets[0].header).toBe(header);
        expect(tickets[0].userId).toBe(user.id);
        expect(tickets[0].createdAt).not.toBe(null);
        expect(tickets[0].updatedAt).not.toBe(null);
        expect(tickets[0].deletedAt).toBe(undefined);
      });
      it('should trim value', async () => {
        const body = 'ticket body';
        const header = 'header body';
        const { status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            body: `${body} `,
            header: ` ${header} `,
          });
        const ticket = await Ticket.findOne({
          where: { userId: user.id },
        });
        expect(status).toBe(204);
        expect(ticket!.header).toBe(header);
        expect(ticket!.body).toBe(body);
      });
    });
  });
  describe('should return status 400 if', () => {
    describe('header', () => {
      const ticketBody = 'ticket body';
      it('is not set', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            body: ticketBody,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            header: FIELD_IS_REQUIRED,
          },
        });
      });
      it('is empty', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header: '',
            body: ticketBody,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            header: FIELD_IS_EMPTY,
          },
        });
      });
      it('is not a string', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header: 1234567890,
            body: ticketBody,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            header: FIELD_NOT_A_STRING,
          },
        });
      });
      it('less than 5 characters', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header: 'aaaa',
            body: ticketBody,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            header: FIELD_MIN_LENGTH_OF_FIVE,
          },
        });
      });
      it('more than 30 characters', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header: 'a'.repeat(31),
            body: ticketBody,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            header: FIELD_MAX_LENGTH_THRITY,
          },
        });
      });
    });
    describe('body', () => {
      const header = 'header';
      it('is not set', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            body: FIELD_IS_REQUIRED,
          },
        });
      });
      it('is empty', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header,
            body: '',
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            body: FIELD_IS_EMPTY,
          },
        });
      });
      it('is not a string', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header,
            body: 123456789,
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            body: FIELD_NOT_A_STRING,
          },
        });
      });
      it('less than 10 characters', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header,
            body: 'aaaaaaaaa',
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            body: FIELD_MIN_LENGTH_OF_TEN,
          },
        });
      });
      it('more than 200 characters', async () => {
        const { body, status } = await agent
          .post('/tickets')
          .set('authorization', token)
          .send({
            header,
            body: 'a'.repeat(201),
          });
        expect(status).toBe(400);
        expect(body).toStrictEqual({
          errors: {
            body: FIELD_MAX_LENGTH_TWO_HUNDRER,
          },
        });
      });
    });
  });
});
