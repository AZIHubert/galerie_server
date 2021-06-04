import { Server } from 'http';
import { Sequelize } from 'sequelize';

import '@src/helpers/initEnv';

import {
  Ticket,
  User,
} from '@src/db/models';

import {
  FIELD_CANNOT_BE_EMPTY,
  FIELD_IS_REQUIRED,
  FIELD_MAX_LENGTH,
  FIELD_MIN_LENGTH,
  FIELD_SHOULD_BE_A_STRING,
} from '@src/helpers/errorMessages';
import initSequelize from '@src/helpers/initSequelize.js';
import {
  createUser,
  login,
  postTicket,
} from '@src/helpers/test';

import initApp from '@src/server';

const userPassword = 'Password0!';

describe('/tickets', () => {
  let app: Server;
  let sequelize: Sequelize;
  let token: string;
  let user: User;

  beforeAll(() => {
    sequelize = initSequelize();
    app = initApp();
  });

  beforeEach(async (done) => {
    try {
      await sequelize.sync({ force: true });
      user = await createUser({});
      const { body } = await login(app, user.email, userPassword);
      token = body.token;
    } catch (err) {
      done(err);
    }
    done();
  });

  afterAll(async (done) => {
    try {
      await sequelize.sync({ force: true });
      await sequelize.close();
    } catch (err) {
      done(err);
    }
    app.close();
    done();
  });

  describe('POST', () => {
    describe('should return status 200 and', () => {
      it('create a ticket', async () => {
        const body = 'ticket body';
        const header = 'header body';
        const {
          body: {
            action,
          },
          status,
        } = await postTicket(app, token, {
          body,
          header,
        });
        const tickets = await Ticket.findAll();
        expect(action).toBe('POST');
        expect(status).toBe(200);
        expect(tickets.length).toBe(1);
        expect(tickets[0].body).toBe(body);
        expect(tickets[0].header).toBe(header);
        expect(tickets[0].userId).toBe(user.id);
      });
      it('should trim request.body', async () => {
        const body = 'ticket body';
        const header = 'header body';
        await postTicket(app, token, {
          body: ` ${body} `,
          header: ` ${header} `,
        });
        const [ticket] = await Ticket.findAll();
        expect(ticket.body).toBe(body);
        expect(ticket.header).toBe(header);
      });
    });
  });
  describe('should return status 400 if', () => {
    describe('body', () => {
      it('is not set', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_IS_REQUIRED,
        });
        expect(status).toBe(400);
      });
      it('is an empty string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: '',
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_CANNOT_BE_EMPTY,
        });
        expect(status).toBe(400);
      });
      it('is not a string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 1234,
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_SHOULD_BE_A_STRING,
        });
        expect(status).toBe(400);
      });
      it('has less than 10 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'a'.repeat(9),
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_MIN_LENGTH(10),
        });
        expect(status).toBe(400);
      });
      it('has more than 200 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'a'.repeat(201),
          header: 'ticket header',
        });
        expect(body.errors).toEqual({
          body: FIELD_MAX_LENGTH(200),
        });
        expect(status).toBe(400);
      });
    });
    describe('header', () => {
      it('is not set', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
        });
        expect(body.errors).toEqual({
          header: FIELD_IS_REQUIRED,
        });
        expect(status).toBe(400);
      });
      it('is an empty string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: '',
        });
        expect(body.errors).toEqual({
          header: FIELD_CANNOT_BE_EMPTY,
        });
        expect(status).toBe(400);
      });
      it('is not a string', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: 1234,
        });
        expect(body.errors).toEqual({
          header: FIELD_SHOULD_BE_A_STRING,
        });
        expect(status).toBe(400);
      });
      it('has less than 5 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: 'a'.repeat(4),
        });
        expect(body.errors).toEqual({
          header: FIELD_MIN_LENGTH(5),
        });
        expect(status).toBe(400);
      });
      it('has more than 30 characters', async () => {
        const {
          body,
          status,
        } = await postTicket(app, token, {
          body: 'ticket body',
          header: 'a'.repeat(31),
        });
        expect(body.errors).toEqual({
          header: FIELD_MAX_LENGTH(30),
        });
        expect(status).toBe(400);
      });
    });
  });
});
